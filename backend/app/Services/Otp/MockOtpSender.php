<?php

declare(strict_types=1);

namespace App\Services\Otp;

class MockOtpSender implements OtpSender
{
    public function send(string $phone, string $code): void
    {
        // Development: kode OTP dikembalikan lewat respons API.
    }
}
