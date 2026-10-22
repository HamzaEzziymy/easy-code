<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'license_category_id',
        'student_number',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'photo_path',
        'cin',
        'birth_date',
        'birthplace',
        'gender',
        'phone',
        'lessons_count',
        'lessons_total',
        'enrollment_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'enrollment_date' => 'date',
            'birth_date' => 'date',
            'lessons_count' => 'integer',
            'lessons_total' => 'integer',
        ];
    }

    /**
     * Mirrored onto the account name so the sign-in screens, avatars and the user list
     * keep working; the file itself stays the source of truth.
     */
    public function displayName(): string
    {
        $name = trim($this->first_name.' '.$this->last_name);

        return $name !== '' ? $name : (string) $this->user?->name;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function licenseCategory(): BelongsTo
    {
        return $this->belongsTo(LicenseCategory::class);
    }

    public function examAttempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(StudentAppointment::class);
    }

    public function successRecords(): HasMany
    {
        return $this->hasMany(StudentSuccessRecord::class);
    }
}
