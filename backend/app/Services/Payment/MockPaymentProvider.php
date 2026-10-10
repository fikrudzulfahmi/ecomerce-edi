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
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'gdc',
            'status' => 'pending',
            'external_ref' => 'MOCK-'.Str::upper(Str::random(10)),
        ]);

        return new PaymentResult(
            payment: $payment,
            redirectUrl: config('app.frontend_url').'/payment/'.$order->code,
        );
    }
}
