<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductType: string
{
    case Book = 'book';
    case Other = 'other';
    case Ebook = 'ebook';
    case Bundle = 'bundle';
}
