<?php

declare(strict_types=1);

namespace App\Services\Shipping;

class MockShippingProvider implements ShippingProviderInterface
{
    public function getOptions(int $weightGram): array
    {
        $kg = max(1, (int) ceil($weightGram / 1000));

        return [
            new ShippingOption('SiCepat', 'REG', 10_000 + ($kg - 1) * 4_500),
            new ShippingOption('J&T', 'REG', 11_000 + ($kg - 1) * 5_000),
            new ShippingOption('JNE', 'REG', 12_000 + ($kg - 1) * 5_000),
            new ShippingOption('JNE', 'YES', 28_000 + ($kg - 1) * 8_000),
        ];
    }
}
