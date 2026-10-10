<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'courier' => $this->courier,
            'service' => $this->service,
            'awb' => $this->awb,
            'status' => $this->status,
            'cod_amount' => $this->cod_amount,
            'tracking' => $this->tracking,
        ];
    }
}
