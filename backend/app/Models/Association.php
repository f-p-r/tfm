<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Association extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'shortname',
        'slug',
        'description',
        'country_id',
        'region_id',
        'web',
        'disabled',
        'homePageId',
        'owner_id',
        'external_url',
        'management',
        'province',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'disabled' => 'boolean',
        'homePageId' => 'integer',
        'management' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'has_internal_web',
    ];

    /**
     * Get the games for this association.
     */
    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class);
    }

    /**
     * Get the country for this association.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Get the region for this association.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Get the owner (user) for this association.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the has_internal_web attribute.
     * Returns true if there is a page with owner_type=2 and owner_id matching this association.
     */
    public function getHasInternalWebAttribute(): bool
    {
        return Page::where('owner_type', 2)
            ->where('owner_id', $this->id)
            ->exists();
    }
}
