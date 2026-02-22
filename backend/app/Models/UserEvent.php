<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserEvent extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'user_event';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'event_id',
        'status',
        'status_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_id'     => 'integer',
        'event_id'    => 'integer',
        'status'      => 'integer',
        'status_date' => 'datetime',
    ];

    /**
     * Boot method: auto-manage status_date.
     * - On create: sets status_date to now() if not provided.
     * - On update: refreshes status_date whenever status changes.
     */
    protected static function booted(): void
    {
        static::creating(function (UserEvent $userEvent) {
            $userEvent->status_date ??= now();
        });

        static::updating(function (UserEvent $userEvent) {
            if ($userEvent->isDirty('status')) {
                $userEvent->status_date = now();
            }
        });
    }

    /**
     * The user attending the event.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The event being attended.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * The attendance status type.
     */
    public function statusType(): BelongsTo
    {
        return $this->belongsTo(EventAttendanceStatusType::class, 'status');
    }
}
