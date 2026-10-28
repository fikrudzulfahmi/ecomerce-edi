<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Payment\IpaymuClient;
use App\Services\Payment\IpaymuPaymentProvider;
use App\Services\Payment\MockPaymentProvider;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Shipping\MengantarClient;
use App\Services\Shipping\MengantarProvider;
use App\Services\Shipping\MockShippingProvider;
use App\Services\Shipping\ShippingProviderInterface;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(IpaymuClient::class, function (): IpaymuClient {
            return new IpaymuClient(
                (string) config('ipaymu.base_url'),
                (string) config('ipaymu.va'),
                (string) config('ipaymu.api_key'),
            );
        });

        $this->app->bind(PaymentProviderInterface::class, function (): PaymentProviderInterface {
            return match ((string) config('payment.driver')) {
                'ipaymu' => $this->app->make(IpaymuPaymentProvider::class),
                'mock' => $this->app->make(MockPaymentProvider::class),
                default => throw new RuntimeException('PAYMENT_DRIVER tidak dikenal: '.config('payment.driver')),
            };
        });

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
        // MariaDB cPanel (default engine MyISAM) membatasi index ke 1000 byte →
        // 1071 "key too long" pada varchar(255) utf8mb4. Batasi ke 191 (764 byte).
        Schema::defaultStringLength(191);

        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return config('app.frontend_url')
                .'/reset-password?token='.$token
                .'&email='.urlencode($user->getEmailForVerification());
        });
    }
}
