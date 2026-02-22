<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventAttendanceStatusType extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'event_attendance_status_types';

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

    // Status ID constants matching seeder data
    public const PENDING  = 1;
    public const ADMITTED = 2;
    public const REJECTED = 3;

    /**
     * Get all user-event relations with this status.
     */
    public function userEvents(): HasMany
    {
        return $this->hasMany(UserEvent::class, 'status');
    }
}
