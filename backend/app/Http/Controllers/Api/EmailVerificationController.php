<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class EmailVerificationController
{
    public function verify(Request $request): RedirectResponse
    {
        $user = User::findOrFail($request->route('id'));

        if (! hash_equals(sha1($user->getEmailForVerification()), (string) $request->route('hash'))) {
            return redirect($this->frontendUrl('/verify-email?status=invalid'));
        }

        if ($user->hasVerifiedEmail()) {
            return redirect($this->frontendUrl('/verify-email?status=already'));
        }

        $user->markEmailAsVerified();

        return redirect($this->frontendUrl('/verify-email?status=verified'));
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email sudah terverifikasi.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Link verifikasi baru sudah dikirim.']);
    }

    private function frontendUrl(string $path): string
    {
        return rtrim((string) Config::get('app.frontend_url', 'http://localhost:5173'), '/').$path;
    }
}
