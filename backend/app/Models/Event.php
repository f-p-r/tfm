<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
{
    /** @use HasFactory<\Database\Factories\EventFactory> */
    use HasFactory;

    // Scope type constants (same as News and RoleGrant)
    public const SCOPE_GLOBAL = 1;
    public const SCOPE_ASSOCIATION = 2;
    public const SCOPE_GAME = 3;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'scope_type',
        'scope_id',
        'game_id',
        'slug',
        'title',
        'text',
        'content',
        'starts_at',
        'ends_at',
        'country_code',
        'region_id',
        'province_name',
        'municipality_name',
        'postal_code',
        'street_name',
        'street_number',
        'active',
        'registration_open',
        'published',
        'published_at',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'scope_type'   => 'integer',
        'scope_id'     => 'integer',
        'game_id'      => 'integer',
        'content'      => 'array',
        'starts_at'    => 'datetime',
        'ends_at'      => 'datetime',
        'active'            => 'boolean',
        'registration_open' => 'boolean',
        'published'         => 'boolean',
        'published_at'      => 'datetime',
    ];

    /**
     * Boot method to handle automatic field assignment.
     * - game_id is only settable when scope_type is ASSOCIATION (2) or GAME (3).
     * - When scope_type is GAME (3), game_id is automatically set from scope_id.
     */
    protected static function booted(): void
    {
        $autoAssign = function (Event $event) {
            if ($event->scope_type === self::SCOPE_GAME && $event->scope_id) {
                $event->game_id = $event->scope_id;
            }

            // Clear game_id if scope is global (not allowed)
            if ($event->scope_type === self::SCOPE_GLOBAL) {
                $event->game_id = null;
            }
        };

        static::creating($autoAssign);
        static::updating($autoAssign);
    }

    // ---------------------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------------------

    /**
     * The user who created the event.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The game associated with the event (when scope_type is ASSOCIATION or GAME).
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * The country of the event address.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_code', 'id');
    }

    /**
     * The region of the event address.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }
}
