<?php

namespace App\Enums;

enum ScopeType: int
{
    case GLOBAL = 1;
    case ASSOCIATION = 2;
    case GAME = 3;

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
