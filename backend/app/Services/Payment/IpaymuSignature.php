<?php

declare(strict_types=1);

namespace App\Services\Payment;

/**
 * Signature iPaymu.
 *
 * Request (API v2):
 *   stringToSign = METHOD + ":" + VA + ":" + sha256(jsonBody) + ":" + API_KEY
 *   signature    = HMAC-SHA256(stringToSign, API_KEY)
 *
 * Callback:
 *   payload dinormalisasi (tipe data), key diurutkan A-Z, json_encode,
 *   lalu HMAC-SHA256(json, VA).
 */
final class IpaymuSignature
{
    public static function forRequest(string $method, string $va, string $jsonBody, string $apiKey): string
    {
        $stringToSign = strtoupper($method).':'.$va.':'.hash('sha256', $jsonBody).':'.$apiKey;

        return hash_hmac('sha256', $stringToSign, $apiKey);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function forCallback(array $payload, string $va): string
    {
        $normalized = self::normalizeCallback($payload);
        unset($normalized['signature']);
        ksort($normalized);

        return hash_hmac('sha256', (string) json_encode($normalized), $va);
    }

    /**
     * Samakan tipe data seperti yang dipakai iPaymu saat menghitung signature.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function normalizeCallback(array $payload): array
    {
        $normalized = [];

        foreach ($payload as $key => $value) {
            $normalized[$key] = match (true) {
                in_array($key, ['trx_id', 'status_code', 'transaction_status_code', 'paid_off'], true) => (int) $value,
                $key === 'is_escrow' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                $key === 'additional_info' => is_array($value)
                    ? $value
                    : (json_decode((string) $value, true) ?: []),
                is_bool($value) => $value,
                is_int($value), is_float($value) => $value,
                is_string($value) => $value,
                is_null($value) => null,
                default => $value,
            };
        }

        // Wajib ada walau iPaymu tidak mengirimkannya (x-www-form-urlencoded).
        if (! array_key_exists('additional_info', $normalized)) {
            $normalized['additional_info'] = [];
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function verifyCallback(array $payload, string $signature, string $va): bool
    {
        if ($signature === '' || $va === '') {
            return false;
        }

        return hash_equals(self::forCallback($payload, $va), strtolower($signature));
    }
}
