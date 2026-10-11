<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\StoreVoucherRequest;
use App\Http\Requests\Admin\UpdateVoucherRequest;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;

class VoucherController
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Voucher::orderByDesc('id')->get()]);
    }

    public function store(StoreVoucherRequest $request): JsonResponse
    {
        $voucher = Voucher::create($request->validated());

        return response()->json(['data' => $voucher], 201);
    }

    public function update(UpdateVoucherRequest $request, Voucher $voucher): JsonResponse
    {
        $voucher->update($request->validated());

        return response()->json(['data' => $voucher]);
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        $voucher->delete();

        return response()->json(null, 204);
    }

    public function toggle(Voucher $voucher): JsonResponse
    {
        $voucher->update(['is_active' => ! $voucher->is_active]);

        return response()->json(['data' => $voucher]);
    }
}
