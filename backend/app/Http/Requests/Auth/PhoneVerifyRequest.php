<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class PhoneVerifyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'min:9', 'max:16'],
            'code' => ['required', 'string', 'digits:6'],
        ];
    }
}
