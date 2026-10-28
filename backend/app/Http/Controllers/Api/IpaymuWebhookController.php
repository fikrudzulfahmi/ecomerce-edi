<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Exceptions\WebhookRejectedException;
use App\Services\Payment\IpaymuWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class IpaymuWebhookController
{
    public function __construct(private readonly IpaymuWebhookService $webhooks) {}

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();
        $signature = (string) $request->header('X-Signature', '');

        try {
            $this->webhooks->handle($payload, $signature);
        } catch (WebhookRejectedException $e) {
            Log::warning('Webhook iPaymu ditolak', ['message' => $e->getMessage()]);

            return response()->json(['message' => 'Invalid signature.'], 401);
        } catch (Throwable $e) {
            Log::error('Webhook iPaymu gagal diproses', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);

            // 500 membuat iPaymu mengirim ulang callback.
            return response()->json(['message' => 'Failed to process.'], 500);
        }

        return response()->json(['message' => 'OK']);
    }
}
