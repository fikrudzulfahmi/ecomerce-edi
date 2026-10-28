<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Exceptions\BusinessException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IpaymuClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $va,
        private readonly string $apiKey,
    ) {}

    public function isConfigured(): bool
    {
        return $this->va !== '' && $this->apiKey !== '';
    }

    /**
     * Buat sesi pembayaran (Redirect Payment).
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed> Data berisi SessionID & Url
     */
    public function createPayment(array $payload): array
    {
        return $this->post('/payment', $payload);
    }

    /**
     * Cek status transaksi (otoritatif).
     *
     * @return array<string, mixed>
     */
    public function checkTransaction(string $transactionId): array
    {
        return $this->post('/transaction', ['transactionId' => (string) $transactionId]);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function history(array $filters = []): array
    {
        return $this->post('/history', $filters);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function post(string $path, array $payload): array
    {
        if (! $this->isConfigured()) {
            throw new BusinessException('Kredensial iPaymu belum diatur.');
        }

        // WAJIB: iPaymu menghitung ulang hash dari body tanpa escape slash.
        // json_encode default meng-escape "/" menjadi "\/" → signature ditolak.
        $json = (string) json_encode($payload, JSON_UNESCAPED_SLASHES);
        $timestamp = now()->timezone('Asia/Jakarta')->format('YmdHis');
        $signature = IpaymuSignature::forRequest('POST', $this->va, $json, $this->apiKey);

        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'va' => $this->va,
            'signature' => $signature,
            'timestamp' => $timestamp,
        ])->withBody($json, 'application/json')
            ->timeout(20)
            ->post(rtrim($this->baseUrl, '/').$path);

        $body = $response->json();

        if ($response->failed() || ! is_array($body) || ($body['Success'] ?? false) !== true) {
            Log::warning('iPaymu request gagal', [
                'path' => $path,
                'http_status' => $response->status(),
                'response' => $this->truncate($response->body()),
            ]);

            throw new BusinessException($this->errorMessage($body, $response));
        }

        return is_array($body['Data'] ?? null) ? $body['Data'] : [];
    }

    /**
     * @param  array<string, mixed>|null  $body
     */
    private function errorMessage(?array $body, Response $response): string
    {
        $message = is_array($body) ? (string) ($body['Message'] ?? '') : '';

        return $message !== ''
            ? 'iPaymu: '.$message
            : 'Gagal menghubungi iPaymu (HTTP '.$response->status().').';
    }

    private function truncate(string $text, int $limit = 500): string
    {
        return strlen($text) > $limit ? substr($text, 0, $limit).'…' : $text;
    }
}
