<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Exceptions\WebhookRejectedException;
use App\Services\Shipping\MengantarWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MengantarWebhookController
{
    public function __construct(private readonly MengantarWebhookService $service) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $this->service->handle(
                $request->getContent(),
                (string) $request->header('x-signature', ''),
                (string) $request->header('x-timestamp', ''),
            );
        } catch (WebhookRejectedException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        }

        return response()->json(['success' => true]);
    }
}
