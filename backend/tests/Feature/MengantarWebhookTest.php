<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Shipment;
use App\Models\User;
use App\Models\WebhookLog;
use App\Services\Shipping\MengantarWebhookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MengantarWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const BODY = '{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}';

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('mengantar.webhook_secret', 'testsecret');
    }

    private function shipmentFor(OrderStatus $status, string $method = 'gdc'): Shipment
    {
        $user = User::factory()->create();
        $order = $user->orders()->create([
            'code' => 'EDI-WEBHOOK',
            'status' => $status,
            'subtotal' => 100000,
            'shipping_cost' => 12000,
            'total' => 112000,
            'payment_method' => $method,
            'address_snapshot' => ['recipient' => 'Budi'],
        ]);

        return $order->shipment()->create([
            'courier' => 'JNE',
            'service' => 'REG',
            'awb' => 'JNE1234567890',
            'status' => 'pending',
        ]);
    }

    private function headers(string $rawBody): array
    {
        $timestamp = (string) round(microtime(true) * 1000);

        return [
            'x-timestamp' => $timestamp,
            'x-signature' => hash_hmac('sha256', $timestamp.'.'.$rawBody, 'testsecret'),
        ];
    }

    public function test_verify_matches_official_test_vector(): void
    {
        $service = app(MengantarWebhookService::class);

        $this->assertTrue($service->verify(
            '{"cnote_no":"JNE1234567890","order_id":"ORD-000123","courier":"JNE","status_category":"DELIVERED"}',
            '05826dec707ea7164801d952cb7eaf7ce9adc0c8aa0b93366480434164a1a111',
            '1787548800000',
            'testsecret',
        ));
    }

    public function test_rejects_invalid_signature(): void
    {
        $this->postJson('/api/v1/webhooks/mengantar', json_decode(self::BODY, true), [
            'x-timestamp' => '1787548800000',
            'x-signature' => 'wrong-signature',
        ])->assertUnauthorized();
    }

    public function test_rejects_stale_timestamp(): void
    {
        $timestamp = (string) (round(microtime(true) * 1000) - 600_000);
        $this->postJson('/api/v1/webhooks/mengantar', json_decode(self::BODY, true), [
            'x-timestamp' => $timestamp,
            'x-signature' => hash_hmac('sha256', $timestamp.'.'.self::BODY, 'testsecret'),
        ])->assertUnauthorized();
    }

    public function test_marks_order_delivered(): void
    {
        $shipment = $this->shipmentFor(OrderStatus::Shipped);
        $order = $shipment->order;

        $this->postJson('/api/v1/webhooks/mengantar', json_decode(self::BODY, true), $this->headers(self::BODY))
            ->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'DELIVERED']);
        $this->assertDatabaseHas('webhook_logs', ['provider' => 'mengantar', 'signature_valid' => true]);
    }

    public function test_marks_cod_order_completed(): void
    {
        $shipment = $this->shipmentFor(OrderStatus::CodPending, 'cod');
        $order = $shipment->order;

        $this->postJson('/api/v1/webhooks/mengantar', json_decode(self::BODY, true), $this->headers(self::BODY))
            ->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'COD_COMPLETED']);
    }

    public function test_duplicate_webhook_is_idempotent(): void
    {
        $shipment = $this->shipmentFor(OrderStatus::Shipped);
        $order = $shipment->order;

        $this->postJson('/api/v1/webhooks/mengantar', json_decode(self::BODY, true), $this->headers(self::BODY))
            ->assertOk();
        $this->postJson('/api/v1/webhooks/mengantar', json_decode(self::BODY, true), $this->headers(self::BODY))
            ->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'DELIVERED']);
        // hanya satu yang benar-benar diproses
        $this->assertSame(1, WebhookLog::where('provider', 'mengantar')->whereNotNull('processed_at')->count());
    }
}
