<?php

declare(strict_types=1);

namespace App\Services\Shipping;

use App\Enums\OrderStatus;
use App\Exceptions\WebhookRejectedException;
use App\Models\Shipment;
use App\Models\WebhookLog;

class MengantarWebhookService
{
    private const MAX_AGE_MS = 300_000; // 5 menit

    public function handle(string $rawBody, string $signature, string $timestamp): void
    {
        $secret = (string) config('mengantar.webhook_secret', '');

        if (! $this->verify($rawBody, $signature, $timestamp, $secret)) {
            throw new WebhookRejectedException('Signature tidak valid.');
        }

        if ($this->isStale($timestamp)) {
            throw new WebhookRejectedException('Webhook sudah kedaluwarsa.');
        }

        $payload = json_decode($rawBody, true) ?? [];
        $cnoteNo = (string) ($payload['cnote_no'] ?? '');
        $statusCategory = strtoupper((string) ($payload['status_category'] ?? ''));

        $log = WebhookLog::create([
            'provider' => 'mengantar',
            'payload' => array_merge($payload, ['_x_timestamp' => $timestamp]),
            'signature_valid' => true,
        ]);

        // Idempotensi: event yang sama (resi + status) sudah diproses.
        $duplicate = WebhookLog::where('provider', 'mengantar')
            ->where('id', '!=', $log->id)
            ->where('payload->cnote_no', $cnoteNo)
            ->where('payload->status_category', $statusCategory)
            ->whereNotNull('processed_at')
            ->exists();

        if ($duplicate || $cnoteNo === '' || $statusCategory === '') {
            return;
        }

        $this->applyStatus($cnoteNo, $statusCategory);
        $log->update(['processed_at' => now()]);
    }

    public function verify(string $rawBody, string $signature, string $timestamp, string $secret): bool
    {
        if ($secret === '' || $signature === '' || $timestamp === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$rawBody, $secret);

        return hash_equals($expected, $signature);
    }

    private function isStale(string $timestamp): bool
    {
        if (! is_numeric($timestamp)) {
            return true;
        }

        return abs((int) round(microtime(true) * 1000) - (int) $timestamp) > self::MAX_AGE_MS;
    }

    private function applyStatus(string $cnoteNo, string $statusCategory): void
    {
        $shipment = Shipment::where('awb', $cnoteNo)->first();
        if (! $shipment) {
            return;
        }

        $order = $shipment->order;
        if (! $order) {
            return;
        }

        $isCod = $order->payment_method?->value === 'cod';
        $newStatus = $this->mapStatus($statusCategory, $isCod);

        if ($newStatus && $order->status !== $newStatus) {
            $order->update(['status' => $newStatus]);
        }

        $shipment->update(['status' => strtolower($statusCategory)]);
    }

    private function mapStatus(string $statusCategory, bool $isCod): ?OrderStatus
    {
        return match (true) {
            in_array($statusCategory, ['CANCELED', 'CANCELLED'], true) => OrderStatus::Cancelled,
            $statusCategory === 'RTS' => $isCod ? OrderStatus::CodReturned : OrderStatus::Cancelled,
            $statusCategory === 'DELIVERED' => $isCod ? OrderStatus::CodCompleted : OrderStatus::Delivered,
            in_array($statusCategory, ['PICKED UP', 'ON DELIVERY'], true) => OrderStatus::Shipped,
            in_array($statusCategory, ['PENDING PICKUP', 'PICKUP', 'ACTIVE', 'WAITING NEXT PROCESS', 'ACTIVE/WAITING NEXT PROCESS'], true) => OrderStatus::Processing,
            default => null,
        };
    }
}
