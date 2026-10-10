<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\Address\StoreAddressRequest;
use App\Http\Requests\Address\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => AddressResource::collection($addresses)]);
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $makeDefault = (bool) ($data['is_default'] ?? false) || $user->addresses()->count() === 0;

        unset($data['is_default']);

        if ($makeDefault) {
            $user->addresses()->update(['is_default' => false]);
        }

        $address = $user->addresses()->create($data + ['is_default' => $makeDefault]);

        return response()->json(['data' => new AddressResource($address)], 201);
    }

    public function update(UpdateAddressRequest $request, int $address): JsonResponse
    {
        $user = $request->user();
        $addressModel = $user->addresses()->findOrFail($address);
        $data = $request->validated();
        $makeDefault = (bool) ($data['is_default'] ?? false);

        unset($data['is_default']);

        if ($makeDefault) {
            $user->addresses()->whereKeyNot($address)->update(['is_default' => false]);
            $data['is_default'] = true;
        } else {
            $data['is_default'] = $addressModel->is_default;
        }

        $addressModel->update($data);

        return response()->json(['data' => new AddressResource($addressModel)]);
    }

    public function destroy(Request $request, int $address): JsonResponse
    {
        $user = $request->user();
        $addressModel = $user->addresses()->findOrFail($address);
        $wasDefault = (bool) $addressModel->is_default;
        $addressModel->delete();

        if ($wasDefault) {
            $user->addresses()->orderBy('id')->first()?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Alamat dihapus.']);
    }
}
