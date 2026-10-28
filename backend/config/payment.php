<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Payment Driver
    |--------------------------------------------------------------------------
    | mock   = simulasi lokal/tes (tanpa panggilan gateway)
    | ipaymu = gateway produksi/sandbox iPaymu
    */
    'driver' => env('PAYMENT_DRIVER', 'ipaymu'),
];
