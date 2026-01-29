<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    /** @use HasFactory<\Database\Factories\MediaFactory> */
    use HasFactory;

    // Constantes de scope type
    public const SCOPE_GLOBAL = 1;
    public const SCOPE_ASSOCIATION = 2;
    public const SCOPE_GAME = 3;

    // Mapeo string -> integer
    public const SCOPE_TYPES = [
        'global' => self::SCOPE_GLOBAL,
        'association' => self::SCOPE_ASSOCIATION,
        'game' => self::SCOPE_GAME,
    ];

    // Mapeo integer -> string
    public const SCOPE_TYPE_NAMES = [
        self::SCOPE_GLOBAL => 'global',
        self::SCOPE_ASSOCIATION => 'association',
        self::SCOPE_GAME => 'game',
    ];

    protected $fillable = [
        'scope_type',
        'scope_id',
        'url',
        'created_by',
    ];

    protected $casts = [
        'scope_type' => 'integer',
        'scope_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * El usuario que creó el media.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Obtener el nombre del scope type.
     */
    public function getScopeTypeName(): string
    {
        return self::SCOPE_TYPE_NAMES[$this->scope_type] ?? 'unknown';
    }

    /**
     * Convertir string de scope type a entero.
     * Si ya es entero, lo devuelve directamente.
     */
    public static function scopeTypeToInt(string|int $scopeType): ?int
    {
        if (is_int($scopeType)) {
            return $scopeType;
        }

        // Si es string numérico, convertir a entero
        if (is_numeric($scopeType)) {
            return (int)$scopeType;
        }

        // Si es string de nombre (global, association, game), mapear
        return self::SCOPE_TYPES[strtolower($scopeType)] ?? null;
    }
}
