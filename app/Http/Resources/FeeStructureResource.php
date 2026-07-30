<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeStructureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'class_id' => $this->class_id,
            'class' => $this->whenLoaded('schoolClass', fn () => ['id' => $this->schoolClass->id, 'name' => $this->schoolClass->name]),
            'amount' => $this->amount,
            'amount_pkr' => number_format($this->amount / 100, 2),
            'frequency' => $this->frequency,
            'due_day' => $this->due_day,
            'late_fine_per_day' => $this->late_fine_per_day,
            'academic_year' => $this->academic_year,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}
