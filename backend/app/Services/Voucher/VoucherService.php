<?php

declare(strict_types=1);

namespace App\Services\Voucher;

use App\Enums\VoucherType;
use App\Exceptions\BusinessException;
use App\Models\Voucher;
use Illuminate\Support\Str;

class VoucherService
{
    public function validate(string $code, int $subtotal): Voucher
    {
        $voucher = Voucher::where('code', Str::upper(trim($code)))->first();

        if (! $voucher || ! $voucher->is_active) {
            throw new BusinessException('Voucher tidak valid.');
        }

        if ($voucher->starts_at && now()->lt($voucher->starts_at)) {
            throw new BusinessException('Voucher belum aktif.');
        }

        if ($voucher->expires_at && now()->gt($voucher->expires_at)) {
            throw new BusinessException('Voucher sudah kedaluwarsa.');
        }

        if ($voucher->usage_limit !== null && $voucher->used_count >= $voucher->usage_limit) {
            throw new BusinessException('Kuota voucher sudah habis.');
        }

        if ($subtotal < $voucher->min_order) {
            throw new BusinessException(
                'Minimal belanja Rp'.number_format($voucher->min_order, 0, ',', '.').' untuk voucher ini.'
            );
        }

        return $voucher;
    }

    public function calculate(Voucher $voucher, int $subtotal, int $shippingCost): int
    {
        $base = $subtotal + $shippingCost;

        $discount = match ($voucher->type) {
            VoucherType::FreeShipping => $shippingCost,
            VoucherType::DiscountFixed => $voucher->value,
            VoucherType::DiscountPercent => (int) floor($subtotal * $voucher->value / 100),
        };

        return max(0, min($discount, $base));
    }
}
