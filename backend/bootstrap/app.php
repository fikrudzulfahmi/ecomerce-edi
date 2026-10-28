<?php

use App\Exceptions\BusinessException;
use App\Exceptions\WebhookRejectedException;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        // Callback iPaymu ditandatangani dari payload mentah. Konversi string
        // kosong → null (middleware global Laravel) mengubah hash sehingga
        // signature asli dianggap tidak valid.
        $middleware->convertEmptyStringsToNull(except: [
            'api/v1/webhooks/ipaymu',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (BusinessException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        });
        $exceptions->render(function (WebhookRejectedException $e, Request $request) {
            return response()->json(['message' => $e->getMessage()], 401);
        });
    })->create();
