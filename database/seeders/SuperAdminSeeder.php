<?php

namespace Database\Seeders;

use App\Models\SuperAdmin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        SuperAdmin::firstOrCreate(
            ['email' => 'admin@schoolsaas.com'],
            [
                'name' => 'System Super Admin',
                'password' => Hash::make('Admin@123456'),
                'is_active' => true,
            ]
        );
    }
}
