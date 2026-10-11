<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FileController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\DownloadController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\LibraryController;
use App\Http\Controllers\Api\MengantarWebhookController;
use App\Http\Controllers\Api\MockPaymentController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');

    // Webhook Mengantar (publik, diverifikasi HMAC)
    Route::post('/webhooks/mengantar', MengantarWebhookController::class)
        ->withoutMiddleware('throttle:api');

    // Download file digital (link tertanda tangan, kadaluarsa 24 jam)
    Route::get('/downloads/{orderItem}', DownloadController::class)
        ->middleware('signed')
        ->name('downloads.show');

    // Katalog (publik)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:6,1');

        // Keranjang
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::patch('/cart/items/{item}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{item}', [CartController::class, 'removeItem']);

        // Alamat
        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::patch('/addresses/{address}', [AddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);

        // Checkout (butuh email terverifikasi)
        Route::middleware('verified')->group(function (): void {
            Route::get('/checkout/meta', [CheckoutController::class, 'meta']);
            Route::post('/checkout/shipping-options', [CheckoutController::class, 'shippingOptions']);
            Route::post('/checkout/voucher', [CheckoutController::class, 'previewVoucher']);
            Route::post('/checkout', [CheckoutController::class, 'checkout']);
        });

        // Pesanan
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{code}', [OrderController::class, 'show']);
        Route::post('/orders/{code}/cancel', [OrderController::class, 'cancel']);

        // Pustaka (ebook yang sudah dibeli)
        Route::get('/library', [LibraryController::class, 'index']);
        Route::get('/library/items/{orderItem}/download-url', [LibraryController::class, 'downloadUrl']);

        // Simulasi pembayaran GDC (Fase 6, diganti webhook Fase 8)
        Route::post('/orders/{code}/mock-pay', [MockPaymentController::class, 'success']);
        Route::post('/orders/{code}/mock-fail', [MockPaymentController::class, 'failure']);
    });

    // Panel admin
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function (): void {
        Route::get('/dashboard', DashboardController::class);

        Route::post('/files', [FileController::class, 'store']);

        Route::get('/vouchers', [VoucherController::class, 'index']);
        Route::post('/vouchers', [VoucherController::class, 'store']);
        Route::put('/vouchers/{voucher}', [VoucherController::class, 'update']);
        Route::delete('/vouchers/{voucher}', [VoucherController::class, 'destroy']);
        Route::post('/vouchers/{voucher}/toggle', [VoucherController::class, 'toggle']);

        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);

        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);
        Route::post('/products/{product}/toggle', [AdminProductController::class, 'toggleActive']);

        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{code}', [AdminOrderController::class, 'show']);
        Route::post('/orders/{code}/confirm-payment', [AdminOrderController::class, 'confirmPayment']);
        Route::post('/orders/{code}/create-shipment', [AdminOrderController::class, 'createShipment']);
        Route::post('/orders/{code}/status', [AdminOrderController::class, 'changeStatus']);
    });
});
