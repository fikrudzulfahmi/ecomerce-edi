<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'code' => 'EDI-'.Str::upper(Str::random(6)),
            'status' => OrderStatus::PendingPayment,
            'subtotal' => 100000,
            'shipping_cost' => 12000,
            'total' => 112000,
            'payment_method' => PaymentMethod::Gdc,
            'address_snapshot' => [
                'recipient' => $this->faker->name(),
                'phone' => '081234567890',
                'province' => 'Jawa Timur',
                'city' => 'Surabaya',
                'district' => 'Gubeng',
                'postal_code' => '60281',
                'detail' => 'Jl. Contoh No. 1',
            ],
        ];
    }
}
