<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Student
 */
class StudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->user;

        return [
            'id' => $this->id,
            'admission_number' => $this->admission_number,
            'roll_number' => $this->roll_number,
            'status' => $this->status,
            'admission_date' => optional($this->admission_date)->toDateString(),

            // Basic info (list view)
            'name' => optional($user)->name,
            'email' => optional($user)->email,
            'phone' => optional($user)->phone,
            'photo' => optional($user)->avatar,
            'class' => $this->whenLoaded('schoolClass', fn () => [
                'id' => $this->schoolClass?->id,
                'name' => $this->schoolClass?->name,
                'section' => $this->schoolClass?->section,
                'academic_year' => $this->schoolClass?->academic_year,
            ]),

            // Stats (attached by StudentService for list/detail)
            'attendance_percentage' => $this->attendance_percentage,
            'fee_status' => $this->fee_status,
            'last_active' => optional(optional($user)->last_login_at)->toIso8601String(),

            // Full profile
            'father_name' => $this->father_name,
            'mother_name' => $this->mother_name,
            'guardian_name' => $this->guardian_name,
            'guardian_relation' => $this->guardian_relation,
            'emergency_contact' => $this->emergency_contact,
            'blood_group' => $this->blood_group,
            'previous_school' => $this->previous_school,

            'parents' => $this->whenLoaded('parents', fn () => $this->parents->map(fn ($parent) => [
                'id' => $parent->id,
                'name' => $parent->name,
                'email' => $parent->email,
                'phone' => $parent->phone,
                'relation' => $parent->pivot->relation ?? null,
                'is_primary' => (bool) ($parent->pivot->is_primary ?? false),
            ])),

            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
