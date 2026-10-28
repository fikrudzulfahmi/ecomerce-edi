<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class IpaymuPaymentProvider implements PaymentProviderInterface
{
    public function __construct(private readonly IpaymuClient $client) {}

    public function createTransaction(Order $order): PaymentResult
    {
        $order->loadMissing(['items', 'user']);

        $payload = [
            'product' => ['Pesanan '.$order->code],
            'qty' => ['1'],
            'price' => [(int) $order->total],
            'description' => [$this->describe($order)],
            'returnUrl' => $this->returnUrl($order),
            'notifyUrl' => $this->notifyUrl(),
            'cancelUrl' => $this->cancelUrl($order),
            'referenceId' => $order->code,
            'buyerName' => $order->user?->name ?? 'Pembeli',
            'buyerEmail' => $order->user?->email,
            'buyerPhone' => $order->address_snapshot['phone'] ?? $order->user?->phone,
            'expired' => (int) config('ipaymu.expired_hours', 2),
            'feeDirection' => (string) config('ipaymu.fee_direction', 'MERCHANT'),
        ];

        $data = $this->client->createPayment(array_filter(
            $payload,
            static fn ($value) => $value !== null && $value !== '',
        ));

        $sessionId = (string) ($data['SessionID'] ?? '');
        $url = (string) ($data['Url'] ?? '');

        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'provider' => 'ipaymu',
                'status' => 'pending',
                'external_ref' => $sessionId,
                'paid_at' => null,
                'raw_payload' => [
                    'session_id' => $sessionId,
                    'url' => $url,
                    'request' => [
                        'reference_id' => $order->code,
                        'amount' => $order->total,
                    ],
                    'response' => $data,
                ],
            ],
        );

        return new PaymentResult(
            payment: $payment,
            redirectUrl: $url !== '' ? $url : null,
        );
    }

    private function describe(Order $order): string
    {
        $items = $order->items
            ->map(fn ($item) => $item->qty.'x '.$item->name_snapshot)
            ->implode(', ');

        $parts = [$items !== '' ? $items : 'Pesanan '.$order->code];

        if ($order->shipping_cost > 0) {
            $parts[] = 'Ongkir '.number_format($order->shipping_cost, 0, ',', '.');
        }
        if (($order->handling_fee ?? 0) > 0) {
            $parts[] = 'Biaya penanganan '.number_format($order->handling_fee, 0, ',', '.');
        }
        if (($order->discount_amount ?? 0) > 0) {
            $parts[] = 'Diskon -'.number_format($order->discount_amount, 0, ',', '.');
        }

        return Str::limit(implode(' | ', $parts), 200, '');
    }

    private function returnUrl(Order $order): string
    {
        return (string) (config('ipaymu.return_url')
            ?: rtrim((string) config('app.frontend_url'), '/').'/payment/'.$order->code);
    }

    private function cancelUrl(Order $order): string
    {
        return (string) (config('ipaymu.cancel_url')
            ?: rtrim((string) config('app.frontend_url'), '/').'/orders/'.$order->code);
    }

    private function notifyUrl(): string
    {
        return (string) (config('ipaymu.notify_url')
            ?: rtrim((string) config('app.url'), '/').'/api/v1/webhooks/ipaymu');
    }
}
