<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Requests\Auth\PhoneOtpRequest;
use App\Http\Requests\Auth\PhoneVerifyRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Otp\MockOtpSender;
use App\Services\Otp\OtpSender;
use App\Services\Otp\WaGatewayOtpSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PhoneAuthController
{
    public function request(PhoneOtpRequest $request): JsonResponse
    {
        $phone = $this->normalize($request->validated('phone'));
        $code = (string) random_int(100000, 999999);

        Cache::put(
            $this->key($phone),
            ['hash' => Hash::make($code), 'attempts' => 0],
            now()->addMinutes((int) config('otp.ttl_minutes')),
        );

        $this->sender()->send($phone, $code);

        $response = ['message' => 'Kode OTP terkirim.'];

        if (config('otp.driver') === 'mock') {
            $response['otp'] = $code; // hanya untuk development
        }

        return response()->json($response);
    }

    public function verify(PhoneVerifyRequest $request): JsonResponse
    {
        $phone = $this->normalize($request->validated('phone'));
        $code = $request->validated('code');

        $stored = Cache::get($this->key($phone));

        if (! $stored) {
            throw new HttpException(422, 'Kode OTP kedaluwarsa. Silakan minta ulang.');
        }

        if (($stored['attempts'] ?? 0) >= (int) config('otp.max_attempts')) {
            Cache::forget($this->key($phone));

            throw new HttpException(422, 'Terlalu banyak percobaan. Silakan minta kode baru.');
        }

        if (! Hash::check($code, $stored['hash'])) {
            $stored['attempts']++;
            Cache::put($this->key($phone), $stored, now()->addMinutes((int) config('otp.ttl_minutes')));

            throw new HttpException(422, 'Kode OTP salah.');
        }

        Cache::forget($this->key($phone));

        $user = User::where('phone', $phone)->first();

        if (! $user) {
            $user = User::create([
                'name' => 'Pelanggan '.substr($phone, -4),
                'email' => $phone.'@wa.user',
                'phone' => $phone,
                'password' => null,
                'role' => Role::Customer->value,
                'email_verified_at' => now(),
            ]);
        }

        $token = $user->createToken('whatsapp')->plainTextToken;

        return response()->json([
            'data' => new UserResource($user),
            'token' => $token,
        ]);
    }

    private function key(string $phone): string
    {
        return 'otp:'.$phone;
    }

    private function normalize(string $phone): string
    {
        $phone = preg_replace('/\D/', '', (string) $phone);

        if (str_starts_with($phone, '0')) {
            $phone = '62'.substr($phone, 1);
        }

        return $phone;
    }

    private function sender(): OtpSender
    {
        return config('otp.driver') === 'wa_gateway'
            ? app(WaGatewayOtpSender::class)
            : app(MockOtpSender::class);
    }
}
