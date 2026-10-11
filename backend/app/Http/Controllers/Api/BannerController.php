<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\Banner;
use Illuminate\Http\JsonResponse;

class BannerController
{
    public function index(): JsonResponse
    {
        $banners = Banner::where('is_active', true)->orderBy('sort_order')->get();

        return response()->json(['data' => $banners]);
    }
}
