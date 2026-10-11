<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\OrderItem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DownloadController
{
    public function __invoke(OrderItem $orderItem): BinaryFileResponse
    {
        $path = $orderItem->product?->digital_file;

        if (! $path || ! $orderItem->order->isPaidForDownload() || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $filename = Str::slug($orderItem->name_snapshot).'.'.$ext;

        return response()->download(Storage::disk('local')->path($path), $filename);
    }
}
