<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Payment\MockPaymentProvider;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Shipping\MockShippingProvider;
use App\Services\Shipping\ShippingProviderInterface;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Fase 6: driver mock. Fase 7/8: ganti ke MengantarProvider/GdcPaymentProvider
        // berdasarkan config('shipping.driver') / config('payment.driver').
        $this->app->bind(PaymentProviderInterface::class, MockPaymentProvider::class);
        $this->app->bind(ShippingProviderInterface::class, MockShippingProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return config('app.frontend_url')
                .'/reset-password?token='.$token
                .'&email='.urlencode($user->getEmailForVerification());
        });
    }
}
