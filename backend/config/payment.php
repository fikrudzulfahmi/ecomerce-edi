<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Payment Driver
    |--------------------------------------------------------------------------
    | mock = simulasi (Fase 6). gdc = produksi (Fase 8, setelah dokumentasi resmi).
    */
    'driver' => env('PAYMENT_DRIVER', 'mock'),
];
