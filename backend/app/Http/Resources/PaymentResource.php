<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payload = $this->raw_payload ?? [];

        return [
            'provider' => $this->provider,
            'status' => $this->status,
            'external_ref' => $this->external_ref,
            'paid_at' => $this->paid_at?->toISOString(),
            'channel' => $payload['channel'] ?? null,
            'via' => $payload['via'] ?? null,
            'payment_no' => $payload['payment_no'] ?? null,
            'trx_id' => $payload['trx_id'] ?? null,
            // URL halaman pembayaran iPaymu (null bila sesi belum dibuat).
            'redirect_url' => $payload['url'] ?? null,
        ];
    }
}
