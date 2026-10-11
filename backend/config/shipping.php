<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Shipping Driver
    |--------------------------------------------------------------------------
    | mock = simulasi (Fase 6). mengantar = Mengantar.id (Fase 7).
    */
    'driver' => env('SHIPPING_DRIVER', 'mock'),
];
