<?php

declare(strict_types=1);

namespace App\Enums;

enum VoucherType: string
{
    case FreeShipping = 'free_shipping';
    case DiscountFixed = 'discount_fixed';
    case DiscountPercent = 'discount_percent';
}
