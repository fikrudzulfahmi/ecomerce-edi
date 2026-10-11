<?php

declare(strict_types=1);

namespace App\Services\Shipping;

class MockShippingProvider implements ShippingProviderInterface
{
    public function getOptions(ShippingDestination $destination, int $weightGram): array
    {
        $kg = max(1, (int) ceil($weightGram / 1000));

        return [
            new ShippingOption('JNE', 'REG', 12000 + ($kg - 1) * 5000, '2-4 hari'),
            new ShippingOption('JNE', 'YES', 28000 + ($kg - 1) * 8000, '1-2 hari'),
            new ShippingOption('J&T', 'REG', 11000 + ($kg - 1) * 5000, '2-4 hari'),
            new ShippingOption('SiCepat', 'REG', 10000 + ($kg - 1) * 4500, '2-4 hari'),
        ];
    }
}
