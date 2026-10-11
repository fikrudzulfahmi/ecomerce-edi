<?php

declare(strict_types=1);

namespace App\Services\Shipping;

use App\Exceptions\BusinessException;
use App\Models\Order;

class MengantarProvider implements ShippingProviderInterface
{
    public function __construct(private readonly MengantarClient $client) {}

    public function getOptions(ShippingDestination $destination, int $weightGram): array
    {
        $originId = $this->originId();
        $destinationId = $this->resolveDestinationId($destination);
        $weightKg = max(0.1, $weightGram / 1000);

        $estimates = $this->client->estimateAll($originId, $destinationId, $weightKg);

        $options = [];
        foreach ($this->couriers() as $courier) {
            $est = $estimates[$courier] ?? null;
            if (! $est || ($est['unsupported'] ?? false)) {
                continue;
            }

            $options[] = new ShippingOption(
                courier: $courier,
                service: 'REG',
                cost: (int) round((float) ($est['price'] ?? 0)),
                estimate: $est['estimatedDate'] ?? $est['estimate_delivery'] ?? null,
            );
        }

        if ($options === []) {
            throw new BusinessException('Tidak ada kurir tersedia untuk tujuan ini.');
        }

        return $options;
    }

    /**
     * Buat resi (AWB) asli di Mengantar untuk order yang sudah dibayar.
     * Dipakai admin (Fase 9). Order harus memuat relasi items.product.
     *
     * @return array{awb: ?string, order_id: ?string, batch: ?string, is_paid: bool}
     */
    public function createShipment(Order $order, ShippingDestination $destination, ShippingOption $option): array
    {
        $order->loadMissing('items.product');

        $payload = [
            'courier' => $option->courier,
            'pickup' => [
                'type' => 'scheduledPickup',
                'volume' => 'volumeMotor',
                'address_id' => $this->pickupAddressId(),
                'time_id' => $this->pickupTimeId(),
            ],
            'orders' => [$this->orderPayload($order, $destination, $option)],
        ];

        $created = $this->client->createOrder($payload);
        $first = $created[0] ?? [];

        if ($first === []) {
            throw new BusinessException('Gagal membuat resi di Mengantar.');
        }

        return [
            'awb' => $first['cnote_no'] ?? null,
            'order_id' => $first['ORDER_ID'] ?? $first['_id'] ?? null,
            'batch' => $first['batch'] ?? null,
            'is_paid' => (bool) ($first['isPaid'] ?? false),
        ];
    }

    public function getStatus(string $trackingId): array
    {
        $order = $this->client->getOrderByTracking($trackingId);

        return [
            'status' => $order['status'] ?? null,
            'history' => $order['history'] ?? [],
        ];
    }

    private function orderPayload(Order $order, ShippingDestination $destination, ShippingOption $option): array
    {
        $address = $order->address_snapshot;

        $payload = [
            'customerAddress' => trim(implode(', ', array_filter([
                $address['detail'] ?? '',
                $address['district'] ?? '',
                $address['city'] ?? '',
                $address['province'] ?? '',
            ])), ' ,'),
            'customerName' => $address['recipient'] ?? '',
            'customerAddressDataId' => $this->resolveDestinationId($destination),
            'customerPhone' => $address['phone'] ?? '',
            'parcelContent' => $order->items->pluck('name_snapshot')->implode(', '),
            'weight' => max(0.1, $this->orderWeight($order) / 1000),
            'quantity' => $order->items->sum('qty'),
        ];

        if ($order->payment_method?->value === 'cod') {
            $payload['COD'] = $order->total;
        } else {
            $payload['goodsValue'] = $order->total;
        }

        return $payload;
    }

    private function orderWeight(Order $order): float
    {
        return (float) $order->items->reduce(
            fn ($carry, $item) => $carry + ($item->qty * ($item->product?->weight_gram ?? 0)),
            0,
        );
    }

    private function resolveDestinationId(ShippingDestination $destination): string
    {
        $candidates = [];
        foreach ($destination->searchKeywords() as $keyword) {
            $candidates = $this->client->searchAddress($keyword);
            if ($candidates !== []) {
                break;
            }
        }

        $match = $this->bestMatch($candidates, $destination);

        if (! $match) {
            throw new BusinessException('Alamat tujuan tidak ditemukan di Mengantar.');
        }

        return (string) $match['_id'];
    }

    private function bestMatch(array $candidates, ShippingDestination $destination): ?array
    {
        $norm = fn ($v) => strtoupper((string) $v);

        foreach ($candidates as $c) {
            $districtOk = $norm($c['DISTRICT_NAME'] ?? '') === $norm($destination->district);
            $cityOk = $norm($c['CITY_NAME'] ?? '') === $norm($destination->city);
            if ($districtOk && $cityOk) {
                return $c;
            }
        }

        foreach ($candidates as $c) {
            if ($norm($c['CITY_NAME'] ?? '') === $norm($destination->city)) {
                return $c;
            }
        }

        return $candidates[0] ?? null;
    }

    private function originId(): string
    {
        if ($id = config('mengantar.origin_id')) {
            return $id;
        }

        $address = $this->client->getAddresses()[0] ?? null;
        if (! $address) {
            throw new BusinessException('Alamat asal (gudang) belum diatur di Mengantar.');
        }

        return (string) ($address['PICKUP_AUTOFILL'] ?? '');
    }

    private function pickupAddressId(): string
    {
        if ($id = config('mengantar.pickup_address_id')) {
            return $id;
        }

        $address = $this->client->getAddresses()[0] ?? null;
        if (! $address) {
            throw new BusinessException('Alamat pickup belum diatur di Mengantar.');
        }

        return (string) ($address['_id'] ?? '');
    }

    private function pickupTimeId(): string
    {
        if ($id = config('mengantar.pickup_time_id')) {
            return $id;
        }

        $time = $this->client->getTimes()[0] ?? null;
        if (! $time) {
            throw new BusinessException('Jadwal pickup belum diatur di Mengantar.');
        }

        return (string) ($time['_id'] ?? '');
    }

    private function couriers(): array
    {
        return config('mengantar.couriers', []);
    }
}
