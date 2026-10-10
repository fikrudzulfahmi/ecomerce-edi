<?php

declare(strict_types=1);

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:20'],
            'province' => ['sometimes', 'required', 'string', 'max:100'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'district' => ['sometimes', 'required', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'required', 'string', 'max:10'],
            'detail' => ['sometimes', 'required', 'string', 'max:500'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
