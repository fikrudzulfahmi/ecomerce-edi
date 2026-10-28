<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class MockPaymentProvider implements PaymentProviderInterface
{
    public function createTransaction(Order $order): PaymentResult
    {
        $url = rtrim((string) config('app.frontend_url'), '/').'/payment/'.$order->code;

        // Satu order = satu baris payment; sesi lama dipakai ulang.
        $payment = Payment::firstOrNew(['order_id' => $order->id]);
        $payment->provider = 'mock';
        $payment->status = 'pending';
        $payment->external_ref ??= 'MOCK-'.Str::upper(Str::random(10));
        $payment->raw_payload = array_merge($payment->raw_payload ?? [], ['url' => $url]);
        $payment->save();

        return new PaymentResult(
            payment: $payment,
            redirectUrl: $url,
        );
    }
}
