<?php

/*
|--------------------------------------------------------------------------
| Role → Permission map
|--------------------------------------------------------------------------
|
| Permissions surfaced in auth responses are derived from the tenant user's
| role column. This keeps permissions working without per-tenant spatie
| permission tables; swap this for spatie tenant-scoped permissions later.
|
*/

return [
    'principal' => [
        'manage_school', 'manage_users', 'manage_classes', 'manage_students',
        'view_students', 'mark_attendance', 'view_attendance', 'manage_exams',
        'enter_results', 'view_results', 'manage_fees', 'collect_fees',
        'manage_expenses', 'manage_salaries', 'view_reports', 'send_notifications',
    ],

    'teacher' => [
        'view_students', 'mark_attendance', 'view_attendance', 'manage_exams',
        'enter_results', 'view_results', 'view_timetable', 'send_notifications',
    ],

    'student' => [
        'view_results', 'view_timetable', 'view_attendance', 'view_fees',
    ],

    'parent' => [
        'view_children', 'view_results', 'view_attendance', 'view_fees', 'view_timetable',
    ],

    'accountant' => [
        'view_fees', 'collect_fees', 'manage_expenses', 'manage_salaries', 'view_reports',
    ],
];
