<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Driver pengiriman OTP (WhatsApp)
    |--------------------------------------------------------------------------
    | mock      — kode OTP dikembalikan lewat respons (untuk development).
    | wa_gateway — kirim lewat gateway WhatsApp lokal (Baileys).
    */
    'driver' => env('OTP_DRIVER', 'mock'),

    'length' => 6,

    'ttl_minutes' => (int) env('OTP_TTL_MINUTES', 5),

    'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),

    'wa_gateway_url' => env('WA_GATEWAY_URL', 'http://127.0.0.1:3001'),

    'wa_gateway_send_path' => env('WA_GATEWAY_SEND_PATH', '/send-message'),
];
