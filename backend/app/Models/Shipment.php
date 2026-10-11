<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    protected $fillable = [
        'order_id',
        'courier',
        'service',
        'awb',
        'status',
        'cod_amount',
        'tracking',
    ];

    protected function casts(): array
    {
        return [
            'cod_amount' => 'integer',
            'tracking' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
