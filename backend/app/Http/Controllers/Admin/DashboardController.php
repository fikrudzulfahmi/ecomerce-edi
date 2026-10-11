<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController
{
    public function __invoke(): JsonResponse
    {
        $revenueStatuses = [
            OrderStatus::Paid,
            OrderStatus::Processing,
            OrderStatus::Shipped,
            OrderStatus::Delivered,
            OrderStatus::CodPending,
            OrderStatus::CodCompleted,
        ];

        return response()->json([
            'data' => [
                'total_orders' => Order::count(),
                'total_revenue' => Order::whereIn('status', $revenueStatuses)->sum('total'),
                'total_products' => Product::count(),
                'low_stock_products' => Product::where('stock', '<=', 5)->count(),
                'total_customers' => User::where('role', Role::Customer)->count(),
                'orders_by_status' => Order::selectRaw('status, count(*) as total')
                    ->groupBy('status')
                    ->pluck('total', 'status'),
                'recent_orders' => OrderResource::collection(
                    Order::with(['user', 'items'])->latest()->limit(5)->get(),
                ),
            ],
        ]);
    }
}
