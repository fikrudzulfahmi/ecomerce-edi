<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | iPaymu
    |--------------------------------------------------------------------------
    | Kredensial sandbox & produksi BERBEDA. Ambil VA + API Key dari
    | Dashboard iPaymu → Integration → API Key pada environment yang dipakai.
    |
    | Sandbox : https://sandbox.ipaymu.com/api/v2
    | Produksi: https://my.ipaymu.com/api/v2
    */
    'base_url' => env('IPAYMU_BASE_URL', 'https://sandbox.ipaymu.com/api/v2'),
    'va' => env('IPAYMU_VA'),
    'api_key' => env('IPAYMU_API_KEY'),

    // Kosongkan untuk memakai {APP_URL}/api/v1/webhooks/ipaymu.
    'notify_url' => env('IPAYMU_NOTIFY_URL'),

    // Halaman tujuan setelah pembayaran (diarahkan ke SPA).
    'return_url' => env('IPAYMU_RETURN_URL'),
    'cancel_url' => env('IPAYMU_CANCEL_URL'),

    // Masa berlaku sesi pembayaran (jam). Selaras dengan expires_at order.
    'expired_hours' => (int) env('IPAYMU_EXPIRED_HOURS', 2),

    // MERCHANT = biaya gateway ditanggung toko, sehingga nominal yang dibayar
    // pembeli sama persis dengan total order (memudahkan rekonsiliasi).
    'fee_direction' => env('IPAYMU_FEE_DIRECTION', 'MERCHANT'),
];
