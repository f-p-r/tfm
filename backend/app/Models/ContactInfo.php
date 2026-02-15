<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactInfo extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'contact_info';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'owner_type',
        'owner_id',
        'contact_type',
        'value',
        'category',
        'label',
        'order',
        'is_public',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'owner_type' => 'integer',
        'owner_id' => 'integer',
        'order' => 'integer',
        'is_public' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['category_label'];

    /**
     * Owner types constants.
     */
    public const OWNER_TYPE_GLOBAL = 1;
    public const OWNER_TYPE_ASSOCIATION = 2;
    public const OWNER_TYPE_GAME = 3;

    /**
     * Contact types and their limits.
     * -1 means unlimited.
     */
    public const CONTACT_LIMITS = [
        'phone' => 2,
        'email' => -1,
        'whatsapp' => -1,
        'facebook' => 1,
        'instagram' => 1,
        'twitter' => 1,
        'discord' => 1,
        'telegram' => 1,
        'youtube' => 1,
        'twitch' => 1,
        'linkedin' => 1,
        'tiktok' => 1,
        'web' => 2,
        'address' => 1,
    ];

    /**
     * Contact types that require category.
     */
    public const TYPES_REQUIRING_CATEGORY = ['email', 'whatsapp', 'phone'];

    /**
     * Valid categories.
     */
    public const VALID_CATEGORIES = [
        'general',
        'support',
        'membership',
        'events',
        'press',
        'admin',
        'other',
    ];

    /**
     * Category translations.
     */
    public const CATEGORY_TRANSLATIONS = [
        'general' => 'General',
        'support' => 'Soporte',
        'membership' => 'Membresía',
        'events' => 'Eventos',
        'press' => 'Prensa',
        'admin' => 'Administración',
        'other' => 'Otro',
    ];

    /**
     * Get the owner (polimorphic manual).
     */
    public function owner()
    {
        if ($this->owner_type === self::OWNER_TYPE_GLOBAL) {
            return null; // Global
        } elseif ($this->owner_type === self::OWNER_TYPE_ASSOCIATION) {
            return $this->belongsTo(Association::class, 'owner_id');
        } elseif ($this->owner_type === self::OWNER_TYPE_GAME) {
            return $this->belongsTo(Game::class, 'owner_id');
        }

        return null;
    }

    /**
     * Get the association owner.
     */
    public function association(): BelongsTo
    {
        return $this->belongsTo(Association::class, 'owner_id');
    }

    /**
     * Get the game owner.
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'owner_id');
    }

    /**
     * Scope to filter by owner.
     */
    public function scopeForOwner($query, int $ownerType, ?int $ownerId)
    {
        return $query->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId);
    }

    /**
     * Scope to filter public contacts.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('id');
    }

    /**
     * Get the translated category label.
     */
    public function getCategoryLabelAttribute(): ?string
    {
        if (!$this->category) {
            return null;
        }

        return self::CATEGORY_TRANSLATIONS[$this->category] ?? $this->category;
    }
}
