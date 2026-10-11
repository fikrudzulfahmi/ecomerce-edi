<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'type' => ['sometimes', 'required', 'in:book,other,ebook,bundle'],
            'price' => ['sometimes', 'required', 'integer', 'min:0'],
            'discount_percent' => ['sometimes', 'integer', 'min:0', 'max:99'],
            'weight_gram' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive'],
            'description' => ['sometimes', 'nullable', 'string'],
            'images' => ['sometimes', 'nullable', 'array'],
            'images.*' => ['string', 'url'],
            'digital_file' => ['sometimes', 'nullable', 'string', 'max:500'],
            'bundle_physical_id' => ['sometimes', 'nullable', 'integer', 'exists:products,id'],
            'book_detail' => ['sometimes', 'nullable', 'array'],
            'book_detail.isbn' => ['nullable', 'string', 'max:50'],
            'book_detail.author' => ['nullable', 'string', 'max:255'],
            'book_detail.publisher' => ['nullable', 'string', 'max:255'],
            'book_detail.year' => ['nullable', 'integer'],
            'book_detail.pages' => ['nullable', 'integer'],
            'book_detail.language' => ['nullable', 'string', 'max:100'],
        ];
    }
}
