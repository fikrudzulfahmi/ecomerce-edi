<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Payment\MockPaymentProvider;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Shipping\MengantarClient;
use App\Services\Shipping\MengantarProvider;
use App\Services\Shipping\MockShippingProvider;
use App\Services\Shipping\ShippingProviderInterface;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Payment: mock (Fase 6). Fase 8: ganti ke GdcPaymentProvider.
        $this->app->bind(PaymentProviderInterface::class, MockPaymentProvider::class);

        $this->app->singleton(MengantarClient::class, function (): MengantarClient {
            return new MengantarClient(
                (string) config('mengantar.base_url'),
                (string) config('mengantar.api_key'),
            );
        });

        $this->app->bind(ShippingProviderInterface::class, function (): ShippingProviderInterface {
            return match (config('shipping.driver')) {
                'mengantar' => app(MengantarProvider::class),
                default => app(MockShippingProvider::class),
            };
        });
    }

    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return config('app.frontend_url')
                .'/reset-password?token='.$token
                .'&email='.urlencode($user->getEmailForVerification());
        });
    }
}
