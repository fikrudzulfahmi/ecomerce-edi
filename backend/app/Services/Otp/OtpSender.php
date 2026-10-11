<?php

declare(strict_types=1);

namespace App\Services\Otp;

interface OtpSender
{
    public function send(string $phone, string $code): void;
}
