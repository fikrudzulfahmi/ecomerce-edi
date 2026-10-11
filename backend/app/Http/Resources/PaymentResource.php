<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'provider' => $this->provider,
            'status' => $this->status,
            'external_ref' => $this->external_ref,
            'paid_at' => $this->paid_at?->toISOString(),
        ];
    }
}
