<?php

declare(strict_types=1);

namespace App\Services\Shipping;

use App\Exceptions\BusinessException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Klien HTTP ke Mengantar Public API.
 * Endpoint: {BASE_URL}/api/public/{API_KEY}/...
 */
class MengantarClient
{
    private ?array $addressesCache = null;

    private ?array $timesCache = null;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $apiKey,
    ) {}

    public function searchAddress(string $keyword): array
    {
        return $this->get('address/search', ['keyword' => $keyword])['data'] ?? [];
    }

    public function estimateAll(string $originId, string $destinationId, float $weightKg, float $codAmount = 0): array
    {
        return $this->get('order/estimate', [
            'origin_id' => $originId,
            'destination_id' => $destinationId,
            'courier' => 'all',
            'weight' => $weightKg,
            'COD_AMOUNT' => $codAmount,
        ])['data'] ?? [];
    }

    public function getAddresses(): array
    {
        return $this->addressesCache ??= ($this->get('address')['data'] ?? []);
    }

    public function getTimes(): array
    {
        return $this->timesCache ??= ($this->get('time')['data'] ?? []);
    }

    public function createOrder(array $payload): array
    {
        return $this->post('order', $payload)['data'] ?? [];
    }

    public function getOrderByTracking(string $trackingId): array
    {
        $data = $this->get('order', ['tracking_id' => $trackingId])['data'] ?? [];

        return $data[0] ?? [];
    }

    private function get(string $path, array $query = []): array
    {
        $response = Http::baseUrl($this->baseUrl)
            ->timeout(20)
            ->get("/api/public/{$this->apiKey}/{$path}", $query);

        return $this->decode($response);
    }

    private function post(string $path, array $body = []): array
    {
        $response = Http::baseUrl($this->baseUrl)
            ->timeout(30)
            ->asJson()
            ->post("/api/public/{$this->apiKey}/{$path}", $body);

        return $this->decode($response);
    }

    private function decode(Response $response): array
    {
        $json = $response->json();

        if ($response->failed() || ($json['success'] ?? false) !== true) {
            $message = $json['message'] ?? "Mengantar API error (HTTP {$response->status()}).";

            throw new BusinessException($message);
        }

        return $json;
    }
}
