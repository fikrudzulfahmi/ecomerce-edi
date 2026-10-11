<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController
{
    public function redirect(string $provider): RedirectResponse
    {
        return Socialite::driver($provider)->redirect();
    }

    public function callback(string $provider)
    {
        $socialUser = Socialite::driver($provider)->user();

        $user = User::where('email', $socialUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'Pelanggan',
                'email' => $socialUser->getEmail(),
                'password' => null,
                'role' => Role::Customer->value,
                'email_verified_at' => now(),
            ]);
        } elseif ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $token = $user->createToken('google')->plainTextToken;

        $frontend = rtrim(explode(',', (string) config('app.frontend_url', 'http://localhost:5173'))[0], '/');

        return redirect()->away($frontend.'/auth/callback?token='.$token);
    }
}
