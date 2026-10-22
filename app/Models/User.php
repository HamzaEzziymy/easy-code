<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\Digits;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'login_code_hash',
        'login_code',
        'is_active',
        'failed_login_attempts',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'login_code_hash',
        'login_code',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'failed_login_attempts' => 'integer',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    /**
     * Deterministic (and so directly lookupable via the unique login_code_hash index)
     * because the app key acts as the salt; codes are trimmed, case-folded and have any
     * Arabic-Indic digits folded to Latin here, so every code must be issued through
     * this helper to stay verifiable.
     */
    public static function hashLoginCode(string $code): string
    {
        return hash_hmac('sha256', static::normalizeLoginCode($code), (string) config('app.key'));
    }

    /**
     * An Arabic keyboard hands back ١٢٣ where the code was issued as 123, so both
     * spellings have to reach the same hash.
     */
    public static function normalizeLoginCode(string $code): string
    {
        return mb_strtoupper(Digits::latin(trim($code)));
    }

    public function matchesLoginCode(string $code): bool
    {
        return $this->login_code_hash !== null
            && hash_equals($this->login_code_hash, static::hashLoginCode($code));
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function createdQuestions(): HasMany
    {
        return $this->hasMany(Question::class, 'created_by');
    }

    public function createdExams(): HasMany
    {
        return $this->hasMany(Exam::class, 'created_by');
    }

    public function createdAppointments(): HasMany
    {
        return $this->hasMany(StudentAppointment::class, 'created_by');
    }

    public function recordedSuccesses(): HasMany
    {
        return $this->hasMany(StudentSuccessRecord::class, 'recorded_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AdminAuditLog::class, 'admin_user_id');
    }
}
