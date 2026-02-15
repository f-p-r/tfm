<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'team_size',
        'disabled',
        'homePageId',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'team_size' => 'integer',
        'disabled' => 'boolean',
        'homePageId' => 'integer',
    ];

    /**
     * Get the associations that have this game.
     */
    public function associations()
    {
        return $this->belongsToMany(Association::class);
    }

    /**
     * Get the contact info for this game.
     */
    public function contactInfo()
    {
        return $this->hasMany(ContactInfo::class, 'owner_id')
            ->where('owner_type', 3);
    }
}
