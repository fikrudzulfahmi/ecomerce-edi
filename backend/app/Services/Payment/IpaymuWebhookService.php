<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Enums\OrderStatus;
use App\Exceptions\WebhookRejectedException;
use App\Models\Order;
use App\Models\WebhookLog;
use App\Services\Order\OrderService;
use Illuminate\Support\Facades\Log;
use Throwable;

class IpaymuWebhookService
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly IpaymuClient $client,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(array $payload, string $signature): void
    {
        $valid = IpaymuSignature::verifyCallback($payload, $signature, (string) config('ipaymu.va'));

        $log = WebhookLog::create([
            'provider' => 'ipaymu',
            'payload' => $payload,
            'signature_valid' => $valid,
        ]);

        if (! $valid) {
            throw new WebhookRejectedException('Signature iPaymu tidak valid.');
        }

        $reference = (string) ($payload['reference_id'] ?? $payload['referenceId'] ?? '');
        $statusCode = (int) ($payload['status_code'] ?? -99);
        $trxId = (string) ($payload['trx_id'] ?? '');

        $order = $reference !== ''
            ? Order::where('code', $reference)->with('payment')->first()
            : null;

        if (! $order) {
            Log::warning('Callback iPaymu: order tidak ditemukan', ['reference' => $reference]);
            $log->update(['processed_at' => now()]);

            return;
        }

        // Hanya status 1 (berhasil) yang mengubah order menjadi PAID.
        if ($statusCode !== 1) {
            $this->handleNonPaidStatus($order, $statusCode);
            $log->update(['processed_at' => now()]);

            return;
        }

        if ($order->status !== OrderStatus::PendingPayment) {
            $log->update(['processed_at' => now()]);

            return;
        }

        // paid_off = nominal yang dibayar pembeli pada callback iPaymu. Bisa
        // lebih besar dari total order karena fee gateway (SubTotal + Fee),
        // jadi yang ditolak hanya nominal yang kurang dari total.
        $amount = (int) ($payload['paid_off'] ?? $payload['amount'] ?? $payload['total'] ?? 0);
        if ($amount > 0 && $amount < (int) $order->total) {
            Log::warning('Callback iPaymu: nominal kurang dari total order', [
                'order' => $order->code,
                'expected' => $order->total,
                'received' => $amount,
            ]);
            $log->update(['processed_at' => now()]);

            return;
        }

        if (! $this->confirmedByApi($trxId)) {
            return;
        }

        $this->orders->markPaid($order, $this->paymentAttributes($payload));

        $log->update(['processed_at' => now()]);
    }

    /**
     * Verifikasi otoritatif ke API iPaymu. Bila API tidak bisa dihubungi,
     * callback yang sudah lolos signature + cek nominal tetap diproses.
     */
    private function confirmedByApi(string $trxId): bool
    {
        if ($trxId === '') {
            return true;
        }

        try {
            $data = $this->client->checkTransaction($trxId);
        } catch (Throwable $e) {
            Log::warning('Cek transaksi iPaymu gagal, memakai callback bertanda tangan', [
                'trx_id' => $trxId,
                'error' => $e->getMessage(),
            ]);

            return true;
        }

        return IpaymuStatus::isPaid($data);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function handleNonPaidStatus(Order $order, int $statusCode): void
    {
        // -2 = kedaluwarsa. Order dibiarkan PENDING_PAYMENT sampai job expiry
        // berjalan, supaya pembeli masih bisa membuka sesi pembayaran baru.
        if ($statusCode === -2 && $order->payment) {
            $order->payment->update(['status' => 'expired']);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function paymentAttributes(array $payload): array
    {
        return [
            'trx_id' => (string) ($payload['trx_id'] ?? ''),
            'via' => (string) ($payload['via'] ?? ''),
            'channel' => (string) ($payload['channel'] ?? ''),
            'payment_no' => (string) ($payload['payment_no'] ?? ''),
            'paid_at_external' => (string) ($payload['paid_at'] ?? ''),
            'callback' => $payload,
        ];
    }
}
