<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'iso_alpha3',
        'name',
        'phone_code',
    ];

    public function regions(): HasMany
    {
        return $this->hasMany(Region::class);
    }
}
