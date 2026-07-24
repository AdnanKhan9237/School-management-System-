<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SchoolClass
 */
class ClassResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'section' => $this->section,
            'academic_year' => $this->academic_year,
            'max_students' => $this->max_students,
            'is_active' => $this->is_active,
            'students_count' => $this->whenCounted('students'),
            'class_teacher' => $this->whenLoaded('classTeacher', fn () => $this->classTeacher ? [
                'id' => $this->classTeacher->id,
                'name' => $this->classTeacher->name,
                'email' => $this->classTeacher->email,
            ] : null),
            'students' => StudentResource::collection($this->whenLoaded('students')),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
