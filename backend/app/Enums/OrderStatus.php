<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case PendingPayment = 'PENDING_PAYMENT';
    case Paid = 'PAID';
    case Processing = 'PROCESSING';
    case Shipped = 'SHIPPED';
    case Delivered = 'DELIVERED';
    case Cancelled = 'CANCELLED';
    case Expired = 'EXPIRED';
    case CodPending = 'COD_PENDING';
    case CodCompleted = 'COD_COMPLETED';
    case CodReturned = 'COD_RETURNED';
}
