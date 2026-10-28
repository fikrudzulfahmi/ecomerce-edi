<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Rekonsiliasi status pembayaran iPaymu (dipakai halaman pembayaran).
 *
 * Webhook tetap jalur utama; sync ini menutup kasus callback tidak sampai
 * (mis. notifyUrl belum terdaftar atau server sempat down).
 */
class IpaymuPaymentService
{
    public function __construct(
        private readonly IpaymuClient $client,
        private readonly OrderService $orders,
    ) {}

    public function sync(Order $order): void
    {
        if ($order->status !== OrderStatus::PendingPayment) {
            return;
        }

        $payment = $order->payment;

        if (! $payment || $payment->provider !== 'ipaymu') {
            return;
        }

        $trxId = (string) ($payment->raw_payload['trx_id'] ?? '');

        // iPaymu mengizinkan cek transaksi lewat TransactionId, ReferenceId
        // (kode order), atau SessionId. Dicoba berurutan supaya tombol
        // "Cek status pembayaran" tetap berfungsi apa pun yang tersimpan.
        $candidates = array_values(array_unique(array_filter([
            $trxId,
            $this->findTrxIdByReference($order),
            (string) $payment->external_ref,
            $order->code,
        ])));

        foreach ($candidates as $candidate) {
            try {
                $data = $this->client->checkTransaction($candidate);
            } catch (Throwable $e) {
                Log::warning('Sync pembayaran iPaymu gagal', [
                    'order' => $order->code,
                    'candidate' => $candidate,
                    'error' => $e->getMessage(),
                ]);

                continue;
            }

            if (! IpaymuStatus::isPaid($data)) {
                continue;
            }

            $this->orders->markPaid($order, [
                'trx_id' => (string) ($data['TransactionId'] ?? $candidate),
                'via' => (string) ($payment->raw_payload['via'] ?? ($data['TypeDesc'] ?? '')),
                'channel' => (string) ($payment->raw_payload['channel'] ?? ($data['PaymentChannel'] ?? '')),
                'checked' => $data,
            ]);

            return;
        }
    }

    /**
     * Cari TransactionId lewat riwayat transaksi berdasarkan referenceId.
     */
    private function findTrxIdByReference(Order $order): string
    {
        try {
            $data = $this->client->history([
                'startdate' => $order->created_at?->format('Y-m-d') ?? now()->subDay()->format('Y-m-d'),
                'enddate' => now()->timezone('Asia/Jakarta')->format('Y-m-d'),
                'orderBy' => 'id',
                'order' => 'DESC',
                'limit' => '20',
            ]);
        } catch (Throwable $e) {
            Log::warning('Riwayat transaksi iPaymu gagal diambil', [
                'order' => $order->code,
                'error' => $e->getMessage(),
            ]);

            return '';
        }

        $results = $data['Transaction'] ?? $data['Results'] ?? (array_is_list($data) ? $data : []);

        foreach ($results as $row) {
            if (! is_array($row)) {
                continue;
            }

            $reference = (string) ($row['ReferenceId'] ?? $row['reference_id'] ?? '');

            if ($reference === $order->code && IpaymuStatus::isPaid($row)) {
                return (string) ($row['TransactionId'] ?? $row['trx_id'] ?? '');
            }
        }

        return '';
    }
}
