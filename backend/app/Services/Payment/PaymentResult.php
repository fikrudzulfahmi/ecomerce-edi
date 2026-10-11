<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Models\Payment;

readonly class PaymentResult
{
    public function __construct(
        public Payment $payment,
        public ?string $redirectUrl = null,
        public bool $paid = false,
    ) {}
}
