<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Course extends Model
{
    protected $fillable = [
        'license_category_id',
        'created_by',
        'name_ar',
        'name_fr',
        'description_ar',
        'description_fr',
        'cover_path',
        'pdf_ar_path',
        'pdf_fr_path',
        'status',
    ];

    public function licenseCategory(): BelongsTo
    {
        return $this->belongsTo(LicenseCategory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
