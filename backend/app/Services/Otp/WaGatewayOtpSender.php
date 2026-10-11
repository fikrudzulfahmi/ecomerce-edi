<?php

declare(strict_types=1);

namespace App\Services\Otp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WaGatewayOtpSender implements OtpSender
{
    public function send(string $phone, string $code): void
    {
        $base = rtrim((string) config('otp.wa_gateway_url'), '/');
        $path = '/'.ltrim((string) config('otp.wa_gateway_send_path'), '/');
        $message = "Kode verifikasi Edi's Journal Store: {$code}. Jangan bagikan ke siapa pun.";

        try {
            Http::timeout(10)->post($base.$path, [
                'number' => $phone,
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            Log::error('Gagal kirim OTP WhatsApp: '.$e->getMessage());
        }
    }
}
