<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'type' => ['required', 'in:book,other,ebook,bundle'],
            'price' => ['required', 'integer', 'min:0'],
            'weight_gram' => ['nullable', 'integer', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string', 'url'],
            'digital_file' => ['nullable', 'string', 'max:500'],
            'bundle_physical_id' => ['nullable', 'integer', 'exists:products,id'],
            'book_detail' => ['nullable', 'array'],
            'book_detail.isbn' => ['nullable', 'string', 'max:50'],
            'book_detail.author' => ['nullable', 'string', 'max:255'],
            'book_detail.publisher' => ['nullable', 'string', 'max:255'],
            'book_detail.year' => ['nullable', 'integer'],
            'book_detail.pages' => ['nullable', 'integer'],
            'book_detail.language' => ['nullable', 'string', 'max:100'],
        ];
    }
}
