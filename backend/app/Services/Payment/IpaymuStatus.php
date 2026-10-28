<?php

declare(strict_types=1);

namespace App\Services\Payment;

/**
 * Normalisasi status transaksi iPaymu.
 *
 * iPaymu memakai beberapa kode untuk transaksi yang sudah dibayar:
 *   1 = berhasil, 6 = settled, 7 = escrow (dana ditahan, umum di sandbox/QRIS).
 * Selain kode, respons menyertakan PaidStatus: "paid" — dipakai sebagai
 * sumber utama supaya kode status baru tidak membuat order tertahan.
 */
class IpaymuStatus
{
    /** @var list<int> */
    public const PAID_CODES = [1, 6, 7];

    /**
     * @param  array<string, mixed>  $data
     */
    public static function isPaid(array $data): bool
    {
        $paidStatus = strtolower(trim((string) ($data['PaidStatus'] ?? '')));

        if ($paidStatus === 'paid') {
            return true;
        }

        return in_array((int) ($data['Status'] ?? 0), self::PAID_CODES, true);
    }
}
