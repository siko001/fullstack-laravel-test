<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'owner',
        'location',
        'postcode',
        'project_type',
        'address',
    ];

    public function plans(): HasMany
    {
        return $this->hasMany(ProjectPlan::class);
    }
}
