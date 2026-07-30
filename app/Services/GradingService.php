<?php

declare(strict_types=1);

namespace App\Services;

class GradingService
{
    public function calculateGrade(float $percentage): string
    {
        if ($percentage >= 90) {
            return 'A+';
        }
        if ($percentage >= 80) {
            return 'A';
        }
        if ($percentage >= 70) {
            return 'B';
        }
        if ($percentage >= 60) {
            return 'C';
        }
        if ($percentage >= 50) {
            return 'D';
        }

        return 'F';
    }

    public function calculateRanks(array $studentScores): array
    {
        usort($studentScores, fn ($a, $b) => $b['obtained_total'] <=> $a['obtained_total']);
        $ranks = [];
        $currentRank = 1;

        foreach ($studentScores as $index => $score) {
            if ($index > 0 && $score['obtained_total'] < $studentScores[$index - 1]['obtained_total']) {
                $currentRank = $index + 1;
            }
            $ranks[$score['student_id']] = $currentRank;
        }

        return $ranks;
    }
}
