<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Models\Order;

interface PaymentProviderInterface
{
    /**
     * Buat transaksi pembayaran untuk order yang baru dibuat.
     */
    public function createTransaction(Order $order): PaymentResult;
}
