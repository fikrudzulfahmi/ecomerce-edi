<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController
{
    public function __invoke(): JsonResponse
    {
        $dbOk = true;

        try {
            DB::select('select 1');
        } catch (\Throwable) {
            $dbOk = false;
        }

        return response()->json([
            'app' => config('app.name'),
            'status' => 'ok',
            'time' => now()->toISOString(),
            'db' => $dbOk ? 'ok' : 'error',
        ]);
    }
}
