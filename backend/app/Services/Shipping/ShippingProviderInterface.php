<?php

declare(strict_types=1);

namespace App\Services\Shipping;

interface ShippingProviderInterface
{
    /**
     * @return list<ShippingOption>
     */
    public function getOptions(int $weightGram): array;
}
