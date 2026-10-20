<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LicenseCategory extends Model
{
    protected $fillable = [
        'code',
        'name_ar',
        'name_fr',
        'description_ar',
        'description_fr',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    public function successRecords(): HasMany
    {
        return $this->hasMany(StudentSuccessRecord::class);
    }
}
