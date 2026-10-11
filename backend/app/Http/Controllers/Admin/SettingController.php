<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'handling_fee' => (int) Setting::get('handling_fee', 0),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'handling_fee' => ['required', 'integer', 'min:0'],
        ]);

        Setting::set('handling_fee', $data['handling_fee']);

        return response()->json([
            'data' => ['handling_fee' => (int) $data['handling_fee']],
        ]);
    }
}
