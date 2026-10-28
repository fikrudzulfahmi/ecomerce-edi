<?php

declare(strict_types=1);

namespace App\Http\Requests\Checkout;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => [
                'nullable',
                'integer',
                Rule::exists('addresses', 'id')->where('user_id', $this->user()->id),
            ],
            'payment_method' => ['nullable', 'in:online,cod,gdc'],
            'courier' => ['nullable', 'string', 'max:100'],
            'service' => ['nullable', 'string', 'max:100'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
        ];
    }
}
