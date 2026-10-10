<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\EmailVerificationController;
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
    });
});
