<?php

use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\SuperAdminAuthController;
use App\Http\Controllers\Api\V1\ClassController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\FeeController;
use App\Http\Controllers\Api\V1\FeeStructureController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ParentController;
use App\Http\Controllers\Api\V1\ReportCardController;
use App\Http\Controllers\Api\V1\ResultController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\SuperAdmin\AnalyticsController;
use App\Http\Controllers\Api\V1\SuperAdmin\InvoiceController;
use App\Http\Controllers\Api\V1\SuperAdmin\PlanController;
use App\Http\Controllers\Api\V1\SuperAdmin\SchoolController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (V1)
|--------------------------------------------------------------------------
|
| Central (super admin) routes run on the central domain. Tenant (school user)
| routes resolve the tenant from the "X-Tenant" header or the request subdomain
| via the IdentifyTenant middleware, then run against the tenant database.
|
*/

Route::prefix('v1')->group(function () {
    // ---- Central: Super Admin -------------------------------------------
    Route::prefix('super-admin')->group(function () {
        Route::post('login', [SuperAdminAuthController::class, 'login'])->middleware('throttle:login');

        Route::middleware(['auth:sanctum', 'super_admin'])->group(function () {
            Route::post('logout', [SuperAdminAuthController::class, 'logout']);
            Route::get('me', [SuperAdminAuthController::class, 'me']);

            // Tenant (school) management
            Route::get('schools', [SchoolController::class, 'index']);
            Route::post('schools', [SchoolController::class, 'store']);
            Route::get('schools/{school}', [SchoolController::class, 'show']);
            Route::put('schools/{school}', [SchoolController::class, 'update']);
            Route::delete('schools/{school}', [SchoolController::class, 'destroy']);
            Route::post('schools/{school}/suspend', [SchoolController::class, 'suspend']);
            Route::post('schools/{school}/activate', [SchoolController::class, 'activate']);
            Route::get('schools/{school}/stats', [SchoolController::class, 'stats']);
            Route::post('schools/{school}/subscribe', [SchoolController::class, 'subscribe']);

            // Subscription plans
            Route::get('plans', [PlanController::class, 'index']);
            Route::post('plans', [PlanController::class, 'store']);
            Route::put('plans/{plan}', [PlanController::class, 'update']);

            // Billing
            Route::get('invoices', [InvoiceController::class, 'index']);
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::post('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid']);

            // Analytics
            Route::get('analytics/overview', [AnalyticsController::class, 'overview']);
            Route::get('analytics/revenue', [AnalyticsController::class, 'revenue']);
            Route::get('analytics/schools', [AnalyticsController::class, 'schools']);
        });
    });

    // ---- Tenant: School Users -------------------------------------------
    Route::prefix('auth')->middleware(['tenant.identify', 'tenant.active'])->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('forgot-password', [PasswordController::class, 'forgotPassword']);
        Route::post('reset-password', [PasswordController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('refresh', [AuthController::class, 'refresh']);
            Route::get('me', [AuthController::class, 'me']);
            Route::post('change-password', [PasswordController::class, 'changePassword']);
        });
    });

    // ---- Tenant: Student Information System (SIS) -----------------------
    Route::middleware(['tenant.identify', 'tenant.active', 'auth:sanctum'])->group(function () {
        // Students (literal routes before {student} to avoid collisions)
        Route::get('students/export', [StudentController::class, 'export']);
        Route::post('students/import', [StudentController::class, 'import']);
        Route::get('students', [StudentController::class, 'index']);
        Route::post('students', [StudentController::class, 'store']);

        Route::whereUuid('student')->group(function () {
            Route::get('students/{student}', [StudentController::class, 'show']);
            Route::put('students/{student}', [StudentController::class, 'update']);
            Route::delete('students/{student}', [StudentController::class, 'destroy']);
            Route::post('students/{student}/transfer', [StudentController::class, 'transfer']);
            Route::get('students/{student}/attendance-summary', [StudentController::class, 'attendanceSummary']);
            Route::get('students/{student}/fee-history', [StudentController::class, 'feeHistory']);
            Route::get('students/{student}/results', [StudentController::class, 'results']);
            Route::post('students/{student}/photo', [StudentController::class, 'photo']);
            Route::post('students/{student}/link-parent', [StudentController::class, 'linkParent']);
        });

        // Classes
        Route::get('classes', [ClassController::class, 'index']);
        Route::post('classes', [ClassController::class, 'store']);
        Route::get('classes/{class}', [ClassController::class, 'show'])->whereUuid('class');
        Route::get('classes/{class}/students', [ClassController::class, 'students'])->whereUuid('class');
        Route::get('classes/{class}/timetable', [ClassController::class, 'timetable'])->whereUuid('class');

        // Parents
        Route::get('parents', [ParentController::class, 'index']);
        Route::post('parents', [ParentController::class, 'store']);
        Route::get('parents/{parent}/children', [ParentController::class, 'children'])->whereUuid('parent');

        // Attendance
        Route::prefix('attendance')->group(function () {
            Route::post('mark', [AttendanceController::class, 'mark']);
            Route::post('mark-single', [AttendanceController::class, 'markSingle']);
            Route::get('today', [AttendanceController::class, 'today']);
            Route::get('summary', [AttendanceController::class, 'summary']);
            Route::get('report/monthly', [AttendanceController::class, 'monthlyReport']);
            Route::get('report/low', [AttendanceController::class, 'lowReport']);
            Route::get('export', [AttendanceController::class, 'export']);
            Route::get('class/{class}', [AttendanceController::class, 'classOnDate'])->whereUuid('class');
            Route::get('student/{student}', [AttendanceController::class, 'studentHistory'])->whereUuid('student');
            Route::put('{attendance}', [AttendanceController::class, 'update'])->whereUuid('attendance');
        });

        // Fees
        Route::prefix('fees')->group(function () {
            Route::get('structures', [FeeStructureController::class, 'index']);
            Route::post('structures', [FeeStructureController::class, 'store']);
            Route::put('structures/{structure}', [FeeStructureController::class, 'update'])->whereUuid('structure');
            Route::delete('structures/{structure}', [FeeStructureController::class, 'destroy'])->whereUuid('structure');

            Route::get('pending', [FeeController::class, 'pending']);
            Route::get('student/{student}', [FeeController::class, 'studentFees'])->whereUuid('student');
            Route::post('collect', [FeeController::class, 'collect']);
            Route::post('bulk-generate', [FeeController::class, 'bulkGenerate']);

            Route::get('receipts/{payment}', [FeeController::class, 'receipt'])->whereUuid('payment');
            Route::get('receipts/{payment}/pdf', [FeeController::class, 'receiptPdf'])->whereUuid('payment');
            Route::get('receipts/student/{student}', [FeeController::class, 'studentReceipts'])->whereUuid('student');

            Route::get('report/collection', [FeeController::class, 'collectionReport']);
            Route::get('report/defaulters', [FeeController::class, 'defaulters']);
            Route::get('report/summary', [FeeController::class, 'summary']);
            Route::get('export', [FeeController::class, 'export']);
        });

        // Exams & Results
        Route::get('exams', [ExamController::class, 'index']);
        Route::post('exams', [ExamController::class, 'store']);
        Route::whereUuid('exam')->group(function () {
            Route::get('exams/{exam}', [ExamController::class, 'show']);
            Route::put('exams/{exam}', [ExamController::class, 'update']);
            Route::delete('exams/{exam}', [ExamController::class, 'destroy']);
            Route::post('exams/{exam}/publish', [ExamController::class, 'publish']);
            Route::post('exams/{exam}/results', [ResultController::class, 'store']);
            Route::get('exams/{exam}/results', [ResultController::class, 'index']);
            Route::get('exams/{exam}/analytics', [ExamController::class, 'analytics']);
            Route::whereUuid('class')->group(function () {
                Route::get('exams/{exam}/results/class/{class}', [ResultController::class, 'classResults']);
            });
        });
        Route::put('results/{result}', [ResultController::class, 'update'])->whereUuid('result');

        // Report Cards
        Route::prefix('report-cards')->group(function () {
            Route::get('student/{student}', [ReportCardController::class, 'student'])->whereUuid('student');
            Route::get('class/{class}', [ReportCardController::class, 'forClass'])->whereUuid('class');
            Route::get('pdf/{student}', [ReportCardController::class, 'pdf'])->whereUuid('student');
        });

        // Notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::post('send', [NotificationController::class, 'send']);
            Route::post('broadcast', [NotificationController::class, 'broadcast']);
            Route::get('my', [NotificationController::class, 'my']);
            Route::put('{notification}/read', [NotificationController::class, 'markRead'])->whereUuid('notification');
        });
    });
});
