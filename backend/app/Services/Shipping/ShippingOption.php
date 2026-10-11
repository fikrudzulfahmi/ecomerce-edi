<?php

declare(strict_types=1);

namespace App\Services\Shipping;

readonly class ShippingOption
{
    public function __construct(
        public string $courier,
        public string $service,
        public int $cost,
        public ?string $estimate = null,
    ) {}

    public function toArray(): array
    {
        return [
            'courier' => $this->courier,
            'service' => $this->service,
            'cost' => $this->cost,
            'estimate' => $this->estimate,
        ];
    }
}
