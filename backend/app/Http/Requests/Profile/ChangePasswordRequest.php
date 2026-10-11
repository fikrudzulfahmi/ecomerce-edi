<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Validator;

class ChangePasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['nullable', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();

            // Jika pengguna punya kata sandi (bukan akun OTP), wajib verifikasi.
            if ($user?->password && ! Hash::check((string) $this->input('current_password'), $user->password)) {
                $validator->errors()->add('current_password', 'Kata sandi saat ini salah.');
            }
        });
    }
}
