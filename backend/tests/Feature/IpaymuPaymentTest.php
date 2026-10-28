<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Models\WebhookLog;
use App\Services\Payment\IpaymuSignature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IpaymuPaymentTest extends TestCase
{
    use RefreshDatabase;

    private const VA = '0000000000000001';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'payment.driver' => 'ipaymu',
            'ipaymu.base_url' => 'https://sandbox.ipaymu.com/api/v2',
            'ipaymu.va' => self::VA,
            'ipaymu.api_key' => 'SANDBOX-TEST-KEY',
            'ipaymu.notify_url' => 'https://api-store.test/api/v1/webhooks/ipaymu',
            'ipaymu.fee_direction' => 'MERCHANT',
        ]);
    }

    private function verifiedUser(): User
    {
        return User::factory()->create(['email_verified_at' => now()]);
    }

    private function addressFor(User $user): Address
    {
        return $user->addresses()->create([
            'recipient' => 'Budi',
            'phone' => '0812',
            'province' => 'Jatim',
            'city' => 'Surabaya',
            'district' => 'Gubeng',
            'postal_code' => '60281',
            'detail' => 'Jl. Raya 1',
            'is_default' => true,
        ]);
    }

    /**
     * Checkout online dengan gateway iPaymu (di-fake) menghasilkan sesi redirect.
     */
    private function pendingOrder(): Order
    {
        Http::fake([
            'sandbox.ipaymu.com/api/v2/payment' => Http::response([
                'Status' => 200,
                'Success' => true,
                'Message' => 'Success',
                'Data' => [
                    'SessionID' => 'SESSION-123',
                    'Url' => 'https://sandbox-payment.ipaymu.com/pay/SESSION-123',
                ],
            ]),
        ]);

        $user = $this->verifiedUser();
        Sanctum::actingAs($user);

        $product = Product::factory()->create(['stock' => 5, 'price' => 50_000, 'weight_gram' => 500]);
        $address = $this->addressFor($user);
        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'qty' => 2]);

        $this->postJson('/api/v1/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'online',
            'courier' => 'JNE',
            'service' => 'REG',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'PENDING_PAYMENT')
            ->assertJsonPath('data.payment.provider', 'ipaymu')
            ->assertJsonPath('data.payment.redirect_url', 'https://sandbox-payment.ipaymu.com/pay/SESSION-123');

        Http::assertSent(fn (HttpRequest $request) => $request->url() === 'https://sandbox.ipaymu.com/api/v2/payment'
            && $request['referenceId'] === Order::query()->latest('id')->value('code')
            && $request->hasHeader('signature')
            && $request->hasHeader('va'));

        return Order::query()->latest('id')->firstOrFail();
    }

    private function callbackPayload(Order $order, array $overrides = []): array
    {
        return array_merge([
            'buyer_email' => 'budi@example.com',
            'buyer_name' => 'Budi',
            'buyer_phone' => '0812',
            'created_at' => now()->format('Y-m-d H:i:s'),
            'expired_at' => now()->addHours(2)->format('Y-m-d H:i:s'),
            'fee' => 1500,
            'paid_at' => now()->format('Y-m-d H:i:s'),
            'reference_id' => $order->code,
            'sid' => 'SESSION-123',
            'status' => 'berhasil',
            'status_code' => '1',
            'status_desc' => 'Success',
            'channel' => 'bca',
            'paid_off' => (string) $order->total,
            'product' => 'Pesanan '.$order->code,
            'quantity' => '1',
            'merchant' => self::VA,
            'merchant_name' => "Edi's Journal Store",
            'system_notes' => 'Payment completed',
            'trx_id' => '98765',
            'unique_code' => '0',
            'via' => 'va',
            'payment_no' => '8808123456',
            'additional_info' => '[]',
            'transaction_status_code' => '1',
            'is_escrow' => '0',
            'is_sandbox' => 'true',
        ], $overrides);
    }

    private function sendCallback(Order $order, array $payload, ?string $signature = null): TestResponse
    {
        $signature ??= IpaymuSignature::forCallback($payload, self::VA);

        return $this->postJson('/api/v1/webhooks/ipaymu', $payload, ['X-Signature' => $signature]);
    }

    public function test_checkout_creates_ipaymu_session_and_redirect_url(): void
    {
        $order = $this->pendingOrder();

        $this->assertSame('online', $order->payment_method->value);
        $this->assertSame('ipaymu', $order->payment?->provider);
        $this->assertSame('pending', $order->payment?->status);
        $this->assertSame('SESSION-123', $order->payment?->external_ref);
        $this->assertNotNull($order->expires_at);
    }

    public function test_payment_endpoint_reuses_pending_session(): void
    {
        $order = $this->pendingOrder();

        $this->postJson("/api/v1/orders/{$order->code}/payment")
            ->assertOk()
            ->assertJsonPath('redirect_url', 'https://sandbox-payment.ipaymu.com/pay/SESSION-123');

        $this->assertSame(1, Payment::query()->where('order_id', $order->id)->count());
    }

    public function test_valid_callback_marks_order_paid(): void
    {
        $order = $this->pendingOrder();

        Http::fake([
            'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
                'Status' => 200,
                'Success' => true,
                'Data' => ['TransactionId' => 98765, 'Status' => 1],
            ]),
        ]);

        $this->sendCallback($order, $this->callbackPayload($order))->assertOk();

        $order->refresh();
        $this->assertSame(OrderStatus::Paid, $order->status);

        $payment = $order->payment->refresh();
        $this->assertSame('paid', $payment->status);
        $this->assertNotNull($payment->paid_at);
        $this->assertSame('98765', $payment->raw_payload['trx_id']);
        $this->assertSame('bca', $payment->raw_payload['channel']);
        $this->assertSame('va', $payment->raw_payload['via']);
        $this->assertSame('8808123456', $payment->raw_payload['payment_no']);

        $log = WebhookLog::query()->where('provider', 'ipaymu')->latest('id')->firstOrFail();
        $this->assertTrue($log->signature_valid);
        $this->assertNotNull($log->processed_at);
    }

    public function test_callback_with_invalid_signature_is_rejected(): void
    {
        $order = $this->pendingOrder();

        $this->sendCallback($order, $this->callbackPayload($order), 'deadbeef')->assertStatus(401);

        $this->assertSame(OrderStatus::PendingPayment, $order->refresh()->status);
        $this->assertSame('pending', $order->payment->refresh()->status);
        $this->assertFalse(WebhookLog::query()->where('provider', 'ipaymu')->latest('id')->firstOrFail()->signature_valid);
    }

    public function test_callback_is_idempotent(): void
    {
        $order = $this->pendingOrder();

        Http::fake([
            'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
                'Status' => 200,
                'Success' => true,
                'Data' => ['TransactionId' => 98765, 'Status' => 1],
            ]),
        ]);

        $payload = $this->callbackPayload($order);
        $this->sendCallback($order, $payload)->assertOk();
        $this->sendCallback($order, $payload)->assertOk();

        $this->assertSame(1, Payment::query()->where('order_id', $order->id)->count());
        $this->assertSame(OrderStatus::Paid, $order->refresh()->status);
    }

    public function test_callback_with_wrong_amount_does_not_mark_paid(): void
    {
        $order = $this->pendingOrder();

        $this->sendCallback($order, $this->callbackPayload($order, ['paid_off' => '1000']))->assertOk();

        $this->assertSame(OrderStatus::PendingPayment, $order->refresh()->status);
        $this->assertSame('pending', $order->payment->refresh()->status);
    }

    public function test_callback_keeps_order_pending_when_ipaymu_says_unpaid(): void
    {
        $order = $this->pendingOrder();

        $this->sendCallback($order, $this->callbackPayload($order, [
            'status' => 'pending',
            'status_code' => '0',
            'transaction_status_code' => '0',
        ]))->assertOk();

        $this->assertSame(OrderStatus::PendingPayment, $order->refresh()->status);
        $this->assertSame('pending', $order->payment->refresh()->status);
    }

    public function test_callback_for_expired_transaction_marks_payment_expired(): void
    {
        $order = $this->pendingOrder();

        $this->sendCallback($order, $this->callbackPayload($order, [
            'status' => 'expired',
            'status_code' => '-2',
            'transaction_status_code' => '-2',
        ]))->assertOk();

        $this->assertSame('expired', $order->payment->refresh()->status);
        $this->assertSame(OrderStatus::PendingPayment, $order->refresh()->status);
    }
}
