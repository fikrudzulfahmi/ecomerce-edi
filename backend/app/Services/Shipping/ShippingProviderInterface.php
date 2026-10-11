<?php

declare(strict_types=1);

namespace App\Services\Shipping;

interface ShippingProviderInterface
{
    /**
     * Cek ongkir ke tujuan tertentu.
     *
     * @return list<ShippingOption>
     */
    public function getOptions(ShippingDestination $destination, int $weightGram): array;
}
