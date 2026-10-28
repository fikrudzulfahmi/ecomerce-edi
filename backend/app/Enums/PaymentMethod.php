<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case Online = 'online';
    case Cod = 'cod';

    /**
     * Nilai lama untuk pembayaran online (sebelum integrasi iPaymu).
     *
     * @deprecated dipertahankan agar order lama tetap bisa dibaca.
     */
    case Gdc = 'gdc';

    public function isOnline(): bool
    {
        return $this === self::Online || $this === self::Gdc;
    }

    public function label(): string
    {
        return match ($this) {
            self::Online, self::Gdc => 'Bayar Online',
            self::Cod => 'Bayar di Tempat (COD)',
        };
    }
}
