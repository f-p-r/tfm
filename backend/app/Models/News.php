<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class News extends Model
{
    /** @use HasFactory<\Database\Factories\NewsFactory> */
    use HasFactory;

    // Scope type constants (same as RoleGrant and Media)
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
        'scope_type' => 'integer',
        'scope_id' => 'integer',
        'game_id' => 'integer',
        'published' => 'boolean',
        'published_at' => 'datetime',
        'content' => 'array',
    ];

    /**
     * Boot method to handle automatic field assignment.
     */
    protected static function booted(): void
    {
        static::creating(function (News $news) {
            // Auto-assign game_id if scope_type is GAME
            if ($news->scope_type === self::SCOPE_GAME && $news->scope_id) {
                $news->game_id = $news->scope_id;
            }
        });

        static::updating(function (News $news) {
            // Auto-assign game_id if scope_type is GAME
            if ($news->scope_type === self::SCOPE_GAME && $news->scope_id) {
                $news->game_id = $news->scope_id;
            }
        });
    }

    /**
     * The creator of the news.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The game associated with the news.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'game_id');
    }

    /**
     * Scope a query to only include published news.
     */
    public function scopePublished($query)
    {
        return $query->where('published', true);
    }

    /**
     * Scope a query to filter by scope type.
     */
    public function scopeByScope($query, int $scopeType, ?int $scopeId)
    {
        return $query->where('scope_type', $scopeType)
            ->where('scope_id', $scopeId);
    }

    /**
     * Scope a query to filter by game.
     */
    public function scopeByGame($query, int $gameId)
    {
        return $query->where('game_id', $gameId);
    }
}
