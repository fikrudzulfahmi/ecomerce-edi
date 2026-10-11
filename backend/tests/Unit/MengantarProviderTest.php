<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Shipping\MengantarClient;
use App\Services\Shipping\MengantarProvider;
use App\Services\Shipping\ShippingDestination;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MengantarProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Http::preventStrayRequests();
        Http::fake(function ($request) {
            $url = $request->url();

            if (str_contains($url, '/address/search')) {
                return Http::response([
                    'success' => true,
                    'data' => [[
                        '_id' => 'dest-1',
                        'PROVINCE_NAME' => 'JAWA TIMUR',
                        'CITY_NAME' => 'SURABAYA',
                        'DISTRICT_NAME' => 'GUBENG',
                    ]],
                ]);
            }

            if (str_contains($url, '/order/estimate')) {
                return Http::response([
                    'success' => true,
                    'data' => [
                        'JNE' => ['price' => 12000, 'estimatedDate' => '2-4 hari'],
                        'JNECargo' => ['price' => 999999],
                        'SiCepat' => ['unsupported' => true],
                        'SAP' => ['price' => 10000],
                    ],
                ]);
            }

            if (str_ends_with($url, '/address')) {
                return Http::response([
                    'success' => true,
                    'data' => [['_id' => 'addr-1', 'PICKUP_AUTOFILL' => 'origin-1']],
                ]);
            }

            return Http::response(['success' => false, 'message' => 'unexpected'], 500);
        });
    }

    public function test_builds_options_skipping_unsupported_and_cargo(): void
    {
        config()->set('mengantar.couriers', ['JNE', 'SiCepat', 'SAP']);

        $provider = new MengantarProvider(new MengantarClient('https://app.mengantar.com', 'key'));
        $options = $provider->getOptions(
            new ShippingDestination('Jawa Timur', 'Surabaya', 'Gubeng', '60281'),
            500,
        );

        $this->assertCount(2, $options);
        $this->assertSame('JNE', $options[0]->courier);
        $this->assertSame(12000, $options[0]->cost);
        $this->assertSame('2-4 hari', $options[0]->estimate);
        $this->assertSame('SAP', $options[1]->courier);
    }
}
