<?php

declare(strict_types=1);

return [
    'base_url' => env('MENGANTAR_BASE_URL', 'https://app.mengantar.com'),
    'api_key' => env('MENGANTAR_API_KEY'),
    'webhook_secret' => env('MENGANTAR_WEBHOOK_SECRET'),

    // Override opsional. Jika kosong, provider mengambil dari /address & /time.
    'origin_id' => env('MENGANTAR_ORIGIN_ID'),
    'pickup_address_id' => env('MENGANTAR_PICKUP_ADDRESS_ID'),
    'pickup_time_id' => env('MENGANTAR_PICKUP_TIME_ID'),

    'couriers' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('MENGANTAR_COURIERS', 'JNE,SiCepat,SAP,JT,anteraja,lion,pos,spx,iDexpress')),
    ))),
];
