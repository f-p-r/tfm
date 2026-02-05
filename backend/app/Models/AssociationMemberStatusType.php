<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssociationMemberStatusType extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'association_member_status_types';

    /**
     * The primary key type.
     *
     * @var string
     */
    protected $keyType = 'integer';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Get the member statuses for this type.
     */
    public function memberStatuses(): HasMany
    {
        return $this->hasMany(AssociationMemberStatus::class, 'type');
    }
}
