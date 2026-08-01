<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSchoolSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if demo tenant already exists
        if (Tenant::where('slug', 'demo')->exists()) {
            $this->command->info('Demo school already exists, skipping.');

            return;
        }

        $this->command->info('Creating demo school tenant…');

        /** @var TenantService $tenantService */
        $tenantService = app(TenantService::class);

        // Create the tenant
        $tenant = $tenantService->createTenant(
            'City Demo School',
            'demo',
            'standard'
        );

        $this->command->info("Tenant created: {$tenant->id}");

        // Seed inside tenant context
        $tenant->run(function () {
            $this->seedTenantData();
        });

        $this->command->info('Demo school seeded successfully!');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Principal',  'principal@demo.com',  'Principal@123'],
                ['Teacher',    'teacher@demo.com',    'Teacher@123'],
                ['Accountant', 'accountant@demo.com', 'Accountant@123'],
                ['Student',    'student@demo.com',    'Student@123'],
                ['Parent',     'parent@demo.com',     'Parent@123'],
            ]
        );
    }

    private function seedTenantData(): void
    {
        $schoolId = tenant('id');

        // ── Users ──────────────────────────────────────────────────────────────
        $principal = User::create([
            'id' => Str::uuid(),
            'school_id' => $schoolId,
            'name' => 'Dr. Ahmed Khan',
            'email' => 'principal@demo.com',
            'phone' => '+923001111111',
            'password' => Hash::make('Principal@123'),
            'role' => 'principal',
            'gender' => 'male',
            'is_active' => true,
        ]);

        $teacher = User::create([
            'id' => Str::uuid(),
            'school_id' => $schoolId,
            'name' => 'Ms. Sara Malik',
            'email' => 'teacher@demo.com',
            'phone' => '+923002222222',
            'password' => Hash::make('Teacher@123'),
            'role' => 'teacher',
            'gender' => 'female',
            'is_active' => true,
        ]);

        $accountant = User::create([
            'id' => Str::uuid(),
            'school_id' => $schoolId,
            'name' => 'Mr. Bilal Raza',
            'email' => 'accountant@demo.com',
            'phone' => '+923003333333',
            'password' => Hash::make('Accountant@123'),
            'role' => 'accountant',
            'gender' => 'male',
            'is_active' => true,
        ]);

        $parentUser = User::create([
            'id' => Str::uuid(),
            'school_id' => $schoolId,
            'name' => 'Mr. Tariq Hussain',
            'email' => 'parent@demo.com',
            'phone' => '+923004444444',
            'password' => Hash::make('Parent@123'),
            'role' => 'parent',
            'gender' => 'male',
            'is_active' => true,
        ]);

        // ── Classes ────────────────────────────────────────────────────────────
        $classes = [];
        foreach ([
            ['Grade 10', 'A'],
            ['Grade 9',  'B'],
            ['Grade 8',  'C'],
        ] as [$name, $section]) {
            $classes[] = SchoolClass::create([
                'id' => Str::uuid(),
                'school_id' => $schoolId,
                'name' => $name,
                'section' => $section,
                'academic_year' => '2026-27',
                'class_teacher_id' => $teacher->id,
                'max_students' => 40,
                'is_active' => true,
            ]);
        }

        // ── Subjects ───────────────────────────────────────────────────────────
        $subjectNames = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Urdu'];
        $subjects = [];
        foreach ($subjectNames as $i => $subjectName) {
            $subjects[] = Subject::create([
                'id' => Str::uuid(),
                'school_id' => $schoolId,
                'name' => $subjectName,
                'code' => strtoupper(substr($subjectName, 0, 3)).'-10',
                'class_id' => $classes[0]->id,
                'teacher_id' => $teacher->id,
                'is_active' => true,
            ]);
        }

        // ── Fee Structure ──────────────────────────────────────────────────────
        $tuitionFee = FeeStructure::create([
            'id' => Str::uuid(),
            'school_id' => $schoolId,
            'name' => 'Tuition Fee',
            'class_id' => null,
            'amount' => 300000, // Rs. 3,000 in paisa
            'frequency' => 'monthly',
            'due_day' => 10,
            'late_fine_per_day' => 100,
            'academic_year' => '2026-27',
            'is_active' => true,
        ]);

        $labFee = FeeStructure::create([
            'id' => Str::uuid(),
            'school_id' => $schoolId,
            'name' => 'Lab Fee',
            'class_id' => $classes[0]->id,
            'amount' => 50000, // Rs. 500 in paisa
            'frequency' => 'monthly',
            'due_day' => 10,
            'late_fine_per_day' => 0,
            'academic_year' => '2026-27',
            'is_active' => true,
        ]);

        // ── Students (10 demo students) ────────────────────────────────────────
        $studentNames = [
            ['Ali Raza',        'male',   '2010-05-15'],
            ['Fatima Noor',     'female', '2010-08-22'],
            ['Muhammad Ahmed',  'male',   '2011-02-10'],
            ['Zainab Bibi',     'female', '2012-11-30'],
            ['Hassan Malik',    'male',   '2011-07-18'],
            ['Ayesha Khan',     'female', '2010-03-05'],
            ['Omar Farooq',     'male',   '2012-09-12'],
            ['Sana Tariq',      'female', '2011-12-25'],
            ['Bilal Ahmad',     'male',   '2010-06-30'],
            ['Nadia Hussain',   'female', '2012-04-14'],
        ];

        $year = now()->year;
        $studentUsers = [];
        $studentModels = [];

        foreach ($studentNames as $idx => [$name, $gender, $dob]) {
            $cls = $classes[$idx % count($classes)];
            $admNum = sprintf('%d-%04d', $year, $idx + 1);

            $studentUser = User::create([
                'id' => Str::uuid(),
                'school_id' => $schoolId,
                'name' => $name,
                'email' => strtolower(str_replace(' ', '.', $name)).'@demo.com',
                'phone' => '+9230055'.str_pad($idx + 1, 5, '0', STR_PAD_LEFT),
                'password' => Hash::make('Student@123'),
                'role' => 'student',
                'gender' => $gender,
                'date_of_birth' => $dob,
                'is_active' => true,
            ]);

            $student = Student::create([
                'id' => Str::uuid(),
                'school_id' => $schoolId,
                'user_id' => $studentUser->id,
                'class_id' => $cls->id,
                'admission_number' => $admNum,
                'roll_number' => (string) ($idx + 101),
                'admission_date' => now()->startOfYear(),
                'father_name' => 'Father of '.$name,
                'mother_name' => 'Mother of '.$name,
                'guardian_name' => 'Guardian of '.$name,
                'guardian_relation' => 'father',
                'emergency_contact' => '+9230055'.str_pad($idx + 1, 5, '0', STR_PAD_LEFT),
                'status' => 'active',
            ]);

            $studentUsers[] = $studentUser;
            $studentModels[] = $student;

            // Link first student to demo parent
            if ($idx === 0) {
                \DB::table('parent_student')->insert([
                    'id' => Str::uuid(),
                    'school_id' => $schoolId,
                    'parent_id' => $parentUser->id,
                    'student_id' => $student->id,
                    'relation' => 'father',
                    'is_primary' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // ── Fee records for last 3 months ──────────────────────────────────
            for ($m = 2; $m >= 0; $m--) {
                $monthDate = now()->startOfMonth()->subMonths($m);
                $monthYear = $monthDate->format('Y-m');
                $dueDate = $monthDate->copy()->setDay(10);
                $isPaid = $m > 0; // Previous months paid, current pending
                $status = $isPaid ? 'paid' : 'pending';

                FeePayment::create([
                    'id' => Str::uuid(),
                    'school_id' => $schoolId,
                    'student_id' => $student->id,
                    'fee_structure_id' => $tuitionFee->id,
                    'amount_due' => $tuitionFee->amount,
                    'amount_paid' => $isPaid ? $tuitionFee->amount : 0,
                    'discount_amount' => 0,
                    'fine_amount' => 0,
                    'month_year' => $monthYear,
                    'due_date' => $dueDate,
                    'paid_date' => $isPaid ? $dueDate : null,
                    'status' => $status,
                    'payment_method' => $isPaid ? 'cash' : null,
                    'received_by' => $isPaid ? $accountant->id : null,
                    'receipt_number' => $isPaid ? sprintf('RCT-%d-%06d', $year, rand(1, 9999)) : null,
                ]);
            }

            // ── Attendance for last 30 days ────────────────────────────────────
            for ($d = 29; $d >= 0; $d--) {
                $attDate = now()->subDays($d)->toDateString();
                $dow = now()->subDays($d)->dayOfWeek;
                if ($dow === 0 || $dow === 6) {
                    continue;
                } // Skip weekends

                $statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
                $attStatus = $statuses[array_rand($statuses)];

                Attendance::create([
                    'id' => Str::uuid(),
                    'school_id' => $schoolId,
                    'student_id' => $student->id,
                    'class_id' => $cls->id,
                    'date' => $attDate,
                    'status' => $attStatus,
                    'marked_by' => $teacher->id,
                    'remarks' => $attStatus === 'late' ? 'Arrived 10 minutes late' : null,
                ]);
            }
        }

        $this->command->info('Seeded 10 students with 3 months fees and 30 days attendance.');
    }
}
