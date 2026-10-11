<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireUnpaidOrders implements ShouldQueue
{
    use Queueable;

    public function handle(OrderService $orderService): void
    {
        Order::query()
            ->where('status', OrderStatus::PendingPayment)
            ->where('expires_at', '<', now())
            ->each(function (Order $order) use ($orderService): void {
                $orderService->expire($order);
            });
    }
}
