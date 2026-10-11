<?php

declare(strict_types=1);

namespace App\Services\Shipping;

readonly class ShippingDestination
{
    public function __construct(
        public string $province,
        public string $city,
        public string $district,
        public string $postalCode,
    ) {}

    /**
     * Keyword untuk mencari kode alamat di /address/search (paling spesifik dulu).
     */
    public function searchKeywords(): array
    {
        return array_values(array_filter([
            $this->district,
            $this->city,
            $this->province,
        ], fn ($v) => $v !== ''));
    }
}
