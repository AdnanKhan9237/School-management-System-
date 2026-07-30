<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'price_monthly' => 300000,
                'price_yearly' => 3000000,
                'max_students' => 300,
                'max_teachers' => 30,
                'features' => ['sis', 'attendance', 'fees'],
                'is_active' => true,
            ],
            [
                'name' => 'Standard',
                'slug' => 'standard',
                'price_monthly' => 600000,
                'price_yearly' => 6000000,
                'max_students' => 600,
                'max_teachers' => 60,
                'features' => ['sis', 'attendance', 'fees', 'exams', 'reports'],
                'is_active' => true,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'price_monthly' => 1000000,
                'price_yearly' => 10000000,
                'max_students' => 1500,
                'max_teachers' => 150,
                'features' => ['sis', 'attendance', 'fees', 'exams', 'reports', 'notifications', 'whatsapp'],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
