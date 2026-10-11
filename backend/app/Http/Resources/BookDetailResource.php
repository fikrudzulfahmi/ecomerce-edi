<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'isbn' => $this->isbn,
            'author' => $this->author,
            'publisher' => $this->publisher,
            'year' => $this->year,
            'pages' => $this->pages,
            'language' => $this->language,
        ];
    }
}
