# Cursor Pro — Complete Prompt Guide
## Multi-Tenant SaaS School Management System
---

> **How to use:** In hain prompts ko Cursor ke chat (Cmd+L / Ctrl+L) mein paste karo.
> Ek prompt complete hone ke baad next prompt use karo. Order follow karna zaroori hai.

---

# PART 1 — .cursorrules FILE (Sabse Pehle Yeh Banao)

> Cursor mein apne project root mein `.cursorrules` file banao aur yeh content paste karo.
> Yeh file Cursor ko aapka poora project context deti hai — har prompt mein yeh automatically apply hogi.

```
You are an expert Laravel 11 + Next.js 15 + Flutter developer building a
Multi-Tenant SaaS School Management System for Pakistani schools.

## PROJECT OVERVIEW
- Platform: Multi-tenant SaaS where each school is a tenant
- Super Admin manages all schools from one dashboard
- Each school gets its own subdomain: schoolname.yourdomain.com
- Tech Stack: Laravel 11 (backend API), Next.js 15 (frontend), Flutter (mobile), PostgreSQL (DB), Redis (cache)

## ARCHITECTURE RULES
- Multi-tenancy: stancl/tenancy package, subdomain-based identification
- Every database table MUST have school_id for tenant isolation
- Authentication: Laravel Sanctum with JWT tokens
- Authorization: Spatie Laravel Permission (RBAC)
- Roles: super_admin, principal, teacher, student, parent, accountant
- API: RESTful, versioned (/api/v1/), JSON responses only
- All money values store in PAISA (smallest unit), display in PKR
- Dates: store UTC, display in Pakistan Standard Time (UTC+5)

## BACKEND CONVENTIONS (Laravel)
- Use Repository Pattern for all database operations
- Use Service classes for business logic
- Use Form Requests for all validation
- Use API Resources for all responses
- Use Laravel Events + Listeners for notifications
- Always use database transactions for financial operations
- Soft deletes on all important models (students, fees, etc.)
- Use Laravel Policies for authorization

## FRONTEND CONVENTIONS (Next.js)
- Use TypeScript everywhere — no plain JS
- Use shadcn/ui for all UI components
- Use Tanstack Query (React Query) for all API calls
- Use Zustand for global state
- Use Zod for form validation
- Use next/image for all images
- Dark mode support via next-themes
- Tailwind CSS for styling — no custom CSS files

## FLUTTER CONVENTIONS
- Use Riverpod for state management
- Use Dio for HTTP calls
- Use go_router for navigation
- Use flutter_secure_storage for tokens

## CODE STYLE
- PHP: PSR-12 coding standard
- TypeScript: strict mode enabled
- Always add loading states and error states in UI
- Always handle network errors gracefully
- Never expose sensitive data in API responses
- Log all errors using Laravel Log facade

## DATABASE
- PostgreSQL 16
- Use UUID as primary keys (not auto-increment integers)
- Add created_at, updated_at, deleted_at to all tables
- Add school_id (UUID, indexed) to all tenant tables
- Add created_by (UUID) to important tables
- Use database migrations — never modify DB manually

## SECURITY
- Never store plain text passwords
- Validate and sanitize all inputs
- Use prepared statements (Eloquent handles this)
- Rate limit all API endpoints
- Require authentication on all routes except login/register
- Log all failed authentication attempts

## RESPONSE FORMAT
Always return responses in this format:
{
  "success": true/false,
  "message": "Human readable message",
  "data": {} or [],
  "errors": {} (only on validation failure)
}

## PAKISTAN-SPECIFIC
- Currency: PKR (Pakistani Rupee), store in paisa
- Phone numbers: +92XXXXXXXXXX format
- Payment gateways: JazzCash, EasyPaisa, Bank transfer
- SMS: Twilio or local gateway
- WhatsApp notifications for parents
- Urdu language support (store as UTF-8)
```

---

# PART 2 — PROJECT SETUP PROMPTS

---

## PROMPT 1 — Laravel Project Initialize

```
Create a new Laravel 11 project for a Multi-Tenant SaaS School Management System.

Install these packages:
1. stancl/tenancy (multi-tenancy)
2. laravel/sanctum (authentication)
3. spatie/laravel-permission (RBAC)
4. spatie/laravel-activity-log (audit logs)
5. barryvdh/laravel-dompdf (PDF generation)
6. maatwebsite/excel (Excel exports)
7. intervention/image (image processing)
8. laravel/horizon (queue management)

After installing, do these configurations:
1. Configure sanctum for subdomain cookies
2. Configure tenancy for subdomain identification
3. Set up Redis as cache and queue driver
4. Set up PostgreSQL as database
5. Configure CORS to allow subdomain requests

Create the folder structure:
app/
  Http/
    Controllers/
      Api/
        V1/
          SuperAdmin/
          School/
          Auth/
    Requests/
    Resources/
    Middleware/
  Services/
    TenantService.php
    AuthService.php
    FeeService.php
    NotificationService.php
  Repositories/
    Interfaces/
    Eloquent/
  Models/

Show me all the commands to run and all files to create/modify.
```

---

## PROMPT 2 — Database Migrations (Central DB)

```
Create Laravel migrations for the CENTRAL database (not tenant).
Central DB stores super admin data and tenant registry.

Create these migrations in order:

1. create_tenants_table
   - id (uuid, primary)
   - name (string) — school name
   - slug (string, unique) — subdomain
   - domain (string, nullable) — custom domain
   - database (string) — tenant DB name
   - plan (enum: basic, standard, premium)
   - status (enum: active, suspended, trial, cancelled)
   - trial_ends_at (timestamp, nullable)
   - max_students (integer, default 500)
   - max_teachers (integer, default 50)
   - onboarded_at (timestamp, nullable)
   - suspended_at (timestamp, nullable)
   - suspension_reason (text, nullable)
   - timestamps, softDeletes

2. create_super_admins_table
   - id (uuid, primary)
   - name (string)
   - email (string, unique)
   - password (string)
   - phone (string, nullable)
   - avatar (string, nullable)
   - is_active (boolean, default true)
   - last_login_at (timestamp, nullable)
   - timestamps, softDeletes

3. create_subscription_plans_table
   - id (uuid, primary)
   - name (string)
   - slug (string, unique)
   - price_monthly (bigInteger) — in paisa
   - price_yearly (bigInteger) — in paisa
   - max_students (integer)
   - max_teachers (integer)
   - features (json) — array of enabled features
   - is_active (boolean, default true)
   - timestamps

4. create_tenant_subscriptions_table
   - id (uuid, primary)
   - tenant_id (uuid, foreign)
   - plan_id (uuid, foreign)
   - billing_cycle (enum: monthly, yearly)
   - amount (bigInteger) — in paisa
   - status (enum: active, expired, cancelled)
   - starts_at (timestamp)
   - ends_at (timestamp)
   - auto_renew (boolean, default true)
   - timestamps

5. create_invoices_table
   - id (uuid, primary)
   - tenant_id (uuid, foreign)
   - subscription_id (uuid, foreign)
   - invoice_number (string, unique)
   - amount (bigInteger) — paisa
   - tax_amount (bigInteger)
   - total_amount (bigInteger)
   - status (enum: pending, paid, overdue, cancelled)
   - due_date (date)
   - paid_at (timestamp, nullable)
   - payment_method (string, nullable)
   - payment_reference (string, nullable)
   - timestamps

Create all migration files with proper indexes on foreign keys and frequently queried columns.
```

---

## PROMPT 3 — Tenant Database Migrations (School Data)

```
Create Laravel migrations for the TENANT database.
These tables exist inside each school's own database.
Every table must have: id (uuid), school_id (uuid), timestamps, softDeletes.

Create these migrations:

1. create_users_table
   - id, school_id
   - name, email (unique per school), phone, password
   - role (enum: principal, teacher, student, parent, accountant)
   - avatar, gender (enum: male, female, other)
   - date_of_birth, address, city
   - is_active (boolean, default true)
   - email_verified_at, last_login_at
   - timestamps, softDeletes

2. create_classes_table (school classes like Grade 1, KG, etc.)
   - id, school_id
   - name (string) — "Grade 1", "KG-A"
   - section (string, nullable) — "A", "B"
   - academic_year (string) — "2024-25"
   - class_teacher_id (uuid, nullable, foreign users)
   - max_students (integer, default 40)
   - is_active (boolean)
   - timestamps, softDeletes

3. create_students_table
   - id, school_id
   - user_id (uuid, foreign)
   - class_id (uuid, foreign)
   - admission_number (string, unique per school)
   - roll_number (string, nullable)
   - admission_date (date)
   - father_name, mother_name
   - guardian_name, guardian_relation
   - emergency_contact (string)
   - blood_group (string, nullable)
   - previous_school (string, nullable)
   - status (enum: active, alumni, transferred, expelled)
   - timestamps, softDeletes

4. create_parent_student_table (pivot)
   - id, school_id
   - parent_id (uuid, foreign users)
   - student_id (uuid, foreign students)
   - relation (enum: father, mother, guardian)
   - is_primary (boolean, default false)
   - timestamps

5. create_subjects_table
   - id, school_id
   - name, code (unique per school)
   - class_id (uuid, foreign)
   - teacher_id (uuid, foreign users, nullable)
   - credit_hours (decimal, nullable)
   - is_active (boolean)
   - timestamps, softDeletes

6. create_attendances_table
   - id, school_id
   - student_id (uuid, foreign)
   - class_id (uuid, foreign)
   - date (date)
   - status (enum: present, absent, late, leave)
   - marked_by (uuid, foreign users)
   - remarks (string, nullable)
   - timestamps
   INDEX on (student_id, date) and (class_id, date)

7. create_fee_structures_table
   - id, school_id
   - name (string) — "Tuition Fee", "Lab Fee"
   - class_id (uuid, foreign, nullable) — null means all classes
   - amount (bigInteger) — paisa
   - frequency (enum: monthly, quarterly, yearly, one_time)
   - due_day (integer, nullable) — day of month
   - late_fine_per_day (bigInteger, default 0)
   - academic_year (string)
   - is_active (boolean)
   - timestamps, softDeletes

8. create_fee_payments_table
   - id, school_id
   - student_id (uuid, foreign)
   - fee_structure_id (uuid, foreign)
   - amount_due (bigInteger) — paisa
   - amount_paid (bigInteger) — paisa
   - discount_amount (bigInteger, default 0)
   - fine_amount (bigInteger, default 0)
   - month_year (string) — "2024-01"
   - due_date (date)
   - paid_date (date, nullable)
   - status (enum: pending, partial, paid, overdue, waived)
   - payment_method (enum: cash, jazzcash, easypaisa, bank, cheque)
   - transaction_id (string, nullable)
   - received_by (uuid, foreign users)
   - receipt_number (string, nullable)
   - remarks (text, nullable)
   - timestamps, softDeletes

9. create_exams_table
   - id, school_id
   - name (string) — "Mid Term 2024", "Final Exam"
   - class_id (uuid, foreign)
   - academic_year (string)
   - start_date, end_date (date)
   - result_date (date, nullable)
   - status (enum: upcoming, ongoing, completed, published)
   - timestamps, softDeletes

10. create_results_table
    - id, school_id
    - exam_id (uuid, foreign)
    - student_id (uuid, foreign)
    - subject_id (uuid, foreign)
    - total_marks (decimal)
    - obtained_marks (decimal)
    - grade (string, nullable)
    - remarks (string, nullable)
    - entered_by (uuid, foreign users)
    - timestamps

11. create_timetables_table
    - id, school_id
    - class_id (uuid, foreign)
    - subject_id (uuid, foreign)
    - teacher_id (uuid, foreign)
    - day_of_week (enum: monday, tuesday, wednesday, thursday, friday, saturday)
    - start_time (time)
    - end_time (time)
    - room_number (string, nullable)
    - academic_year (string)
    - is_active (boolean)
    - timestamps

12. create_expenses_table
    - id, school_id
    - category (string) — "Salary", "Utilities", "Maintenance"
    - description (text)
    - amount (bigInteger) — paisa
    - expense_date (date)
    - payment_method (string)
    - receipt_number (string, nullable)
    - approved_by (uuid, foreign users, nullable)
    - added_by (uuid, foreign users)
    - timestamps, softDeletes

13. create_staff_salaries_table
    - id, school_id
    - teacher_id (uuid, foreign users)
    - month_year (string) — "2024-01"
    - basic_salary (bigInteger) — paisa
    - allowances (bigInteger, default 0)
    - deductions (bigInteger, default 0)
    - net_salary (bigInteger)
    - status (enum: pending, paid)
    - paid_date (date, nullable)
    - payment_method (string, nullable)
    - timestamps, softDeletes

14. create_notifications_table
    - id, school_id
    - title, message (text)
    - type (enum: general, fee_reminder, exam, attendance, result, custom)
    - channel (enum: app, whatsapp, sms, email)
    - recipient_type (enum: all, class, student, parent, teacher)
    - recipient_id (uuid, nullable)
    - sent_at (timestamp, nullable)
    - status (enum: pending, sent, failed)
    - created_by (uuid, foreign users)
    - timestamps

Add proper composite indexes for performance.
```

---

## PROMPT 4 — Models aur Relationships

```
Create Laravel Eloquent Models for all tenant tables created in the previous migrations.

For each model:
1. Define fillable array
2. Define casts (uuid fields, json fields, dates, booleans)
3. Define all relationships (belongsTo, hasMany, belongsToMany)
4. Add school_id global scope so every query is automatically filtered
5. Use UUID trait for primary keys
6. Add SoftDeletes trait where applicable

Create a base TenantModel class that:
- Automatically adds school_id scope
- Has boot method that sets school_id on creating
- Uses UUID primary key

Models to create:
- User (with roles via spatie permission)
- Student (with parent relationship)
- SchoolClass
- Subject
- Attendance
- FeeStructure
- FeePayment (with receipt number auto-generation)
- Exam
- Result
- Timetable
- Expense
- StaffSalary
- Notification

Also create central database models:
- Tenant
- SuperAdmin
- SubscriptionPlan
- TenantSubscription
- Invoice

Show complete model files.
```

---

## PROMPT 5 — Authentication System

```
Build complete authentication system for the school management platform.

Create these API endpoints:

CENTRAL (Super Admin):
POST /api/v1/super-admin/login
POST /api/v1/super-admin/logout
GET  /api/v1/super-admin/me

TENANT (School Users):
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-password

For each endpoint create:
1. Controller (in App\Http\Controllers\Api\V1\Auth\)
2. Form Request for validation
3. API Resource for response
4. Route definition

Authentication flow:
1. User sends email + password + subdomain
2. System identifies tenant from subdomain header
3. Switches to tenant database
4. Validates credentials
5. Returns Sanctum token + user data with permissions

Middleware to create:
- EnsureTenantIsActive (check subscription status)
- IdentifyTenant (from subdomain or header X-Tenant)
- CheckRole (verify user has required role)

Security requirements:
- Rate limit login to 5 attempts per minute per IP
- Lock account after 10 failed attempts
- Log all login attempts (success and failure)
- Token expires in 24 hours
- Refresh token expires in 30 days

Response format for login:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "sanctum_token_here",
    "refresh_token": "...",
    "expires_at": "2024-01-01T00:00:00Z",
    "user": {
      "id": "uuid",
      "name": "Ahmed Khan",
      "email": "ahmed@school.com",
      "role": "teacher",
      "permissions": ["view_students", "mark_attendance"],
      "avatar": null,
      "school": {
        "id": "uuid",
        "name": "The City School",
        "slug": "cityschool",
        "logo": null
      }
    }
  }
}
```

---

## PROMPT 6 — Super Admin Dashboard APIs

```
Build Super Admin Dashboard API endpoints.

Create these endpoints (all require super_admin authentication):

TENANT MANAGEMENT:
GET    /api/v1/super-admin/schools              — list all schools with filters
POST   /api/v1/super-admin/schools              — create new school (onboard)
GET    /api/v1/super-admin/schools/{id}         — school details
PUT    /api/v1/super-admin/schools/{id}         — update school
DELETE /api/v1/super-admin/schools/{id}         — soft delete school
POST   /api/v1/super-admin/schools/{id}/suspend — suspend school with reason
POST   /api/v1/super-admin/schools/{id}/activate — reactivate school
GET    /api/v1/super-admin/schools/{id}/stats    — school statistics

SUBSCRIPTION:
GET  /api/v1/super-admin/plans                  — list all plans
POST /api/v1/super-admin/plans                  — create plan
PUT  /api/v1/super-admin/plans/{id}             — update plan
POST /api/v1/super-admin/schools/{id}/subscribe — assign plan to school

BILLING:
GET /api/v1/super-admin/invoices                — all invoices
GET /api/v1/super-admin/invoices/{id}           — invoice detail
POST /api/v1/super-admin/invoices/{id}/mark-paid — mark as paid

ANALYTICS:
GET /api/v1/super-admin/analytics/overview      — total schools, revenue, active users
GET /api/v1/super-admin/analytics/revenue       — monthly revenue chart data
GET /api/v1/super-admin/analytics/schools       — schools growth chart

For POST /api/v1/super-admin/schools (onboarding), do these steps:
1. Validate school data
2. Create tenant record in central DB
3. Create tenant database
4. Run tenant migrations
5. Create principal user account
6. Assign subdomain
7. Send welcome email to principal
8. Return school details with login credentials

Create:
- SuperAdminController
- TenantOnboardingService (handles all onboarding steps in a transaction)
- TenantResource (API resource)
- All Form Requests
- Routes in routes/api.php

Make onboarding transactional — if any step fails, rollback everything.
```

---

## PROMPT 7 — Student Management APIs

```
Build complete Student Management (SIS) API for school tenants.

Create these endpoints (all scoped to authenticated tenant):

STUDENTS:
GET    /api/v1/students                         — list with search, filter by class, status
POST   /api/v1/students                         — new admission
GET    /api/v1/students/{id}                    — student detail with full profile
PUT    /api/v1/students/{id}                    — update student info
DELETE /api/v1/students/{id}                    — soft delete
POST   /api/v1/students/{id}/transfer           — transfer to another class
POST   /api/v1/students/import                  — bulk import from Excel
GET    /api/v1/students/export                  — export to Excel
GET    /api/v1/students/{id}/attendance-summary — attendance percentage
GET    /api/v1/students/{id}/fee-history        — all fee payments
GET    /api/v1/students/{id}/results            — exam results history
POST   /api/v1/students/{id}/photo              — upload student photo

CLASSES:
GET    /api/v1/classes                          — all classes
POST   /api/v1/classes                          — create class
GET    /api/v1/classes/{id}                     — class detail with students
GET    /api/v1/classes/{id}/students            — students in class
GET    /api/v1/classes/{id}/timetable           — class timetable

PARENTS:
GET    /api/v1/parents                          — list parents
POST   /api/v1/parents                          — add parent account
GET    /api/v1/parents/{id}/children            — children linked to parent
POST   /api/v1/students/{id}/link-parent        — link parent to student

Student list response should include:
- Basic info (name, photo, admission number, class)
- Attendance percentage for current month
- Fee status (paid/pending/overdue)
- Last active (if they have app account)

For admission (POST /api/v1/students):
1. Create user account with role=student
2. Create student record
3. Auto-generate admission number (format: YYYY-NNNN)
4. Link to class
5. Generate fee records for current month
6. Send welcome SMS to parent

StudentResource should include: user info, class info, parent info, stats.

Create:
- StudentController, ClassController, ParentController
- StudentService with all business logic
- StudentRepository
- StudentResource, ClassResource
- StudentImport (Maatwebsite Excel)
- All Form Requests with Urdu-friendly validation messages
```

---

## PROMPT 8 — Attendance System APIs

```
Build complete Attendance Management API.

Endpoints:

ATTENDANCE MARKING:
POST   /api/v1/attendance/mark              — mark attendance for a class (bulk)
POST   /api/v1/attendance/mark-single       — mark single student
PUT    /api/v1/attendance/{id}              — update attendance record

ATTENDANCE VIEWING:
GET    /api/v1/attendance/today             — today's attendance all classes
GET    /api/v1/attendance/class/{id}        — class attendance for a date
GET    /api/v1/attendance/student/{id}      — student attendance history
GET    /api/v1/attendance/summary           — school-wide summary

REPORTS:
GET    /api/v1/attendance/report/monthly    — monthly report (class/student)
GET    /api/v1/attendance/report/low        — students below 75% attendance
GET    /api/v1/attendance/export            — export to Excel

For bulk attendance marking (POST /api/v1/attendance/mark):
Request body:
{
  "class_id": "uuid",
  "date": "2024-01-15",
  "attendance": [
    { "student_id": "uuid", "status": "present" },
    { "student_id": "uuid", "status": "absent" },
    { "student_id": "uuid", "status": "late", "remarks": "15 min late" }
  ]
}

After marking attendance:
1. Save all records
2. Find absent students
3. Queue notification to their parents (WhatsApp/SMS)
4. Update student attendance percentage cache

Attendance summary response:
{
  "date": "2024-01-15",
  "total_students": 450,
  "present": 410,
  "absent": 30,
  "late": 10,
  "percentage": 91.1,
  "by_class": [...]
}

Create:
- AttendanceController
- AttendanceService (with notification dispatching)
- AttendanceRepository
- MarkAttendanceJob (queued job for notifications)
- AttendanceReport class
- All relevant Form Requests and Resources
```

---

## PROMPT 9 — Fee Management APIs

```
Build complete Fee Management System.

Endpoints:

FEE STRUCTURE:
GET    /api/v1/fees/structures              — all fee structures
POST   /api/v1/fees/structures              — create fee type
PUT    /api/v1/fees/structures/{id}         — update
DELETE /api/v1/fees/structures/{id}         — delete

FEE COLLECTION:
GET    /api/v1/fees/pending                 — all pending fees
GET    /api/v1/fees/student/{id}            — student fee details
POST   /api/v1/fees/collect                 — collect fee payment
POST   /api/v1/fees/bulk-generate           — generate monthly fees for all students

RECEIPTS:
GET    /api/v1/fees/receipts/{id}           — receipt detail
GET    /api/v1/fees/receipts/{id}/pdf       — download PDF receipt
GET    /api/v1/fees/receipts/student/{id}   — student receipt history

REPORTS:
GET    /api/v1/fees/report/collection       — collection report by date range
GET    /api/v1/fees/report/defaulters       — students with overdue fees
GET    /api/v1/fees/report/summary          — monthly summary with charts data
GET    /api/v1/fees/export                  — export to Excel

Fee Collection (POST /api/v1/fees/collect):
{
  "student_id": "uuid",
  "payments": [
    {
      "fee_structure_id": "uuid",
      "month_year": "2024-01",
      "amount_paid": 150000,      // paisa
      "discount_amount": 0,
      "payment_method": "jazzcash",
      "transaction_id": "JC123456"
    }
  ],
  "total_amount": 150000,
  "received_by": "uuid"
}

After payment:
1. Wrap in database transaction
2. Create payment record
3. Calculate fine if overdue
4. Auto-generate receipt number (format: RCT-YYYY-NNNNNN)
5. Generate PDF receipt
6. Send WhatsApp receipt to parent
7. Update student fee status cache

PDF Receipt should include:
- School logo and name
- Receipt number and date
- Student name, class, admission number
- Fee breakdown (months, amounts)
- Payment method
- Received by (accountant name)
- School stamp/signature area

Create:
- FeeController, FeeStructureController
- FeeService (business logic with transactions)
- FeeRepository
- FeePaymentResource
- ReceiptPdfService (using DomPDF)
- MonthlyFeeGenerationJob (queued, runs on 1st of month)
- All Form Requests
```

---

## PROMPT 10 — Exam & Result System APIs

```
Build complete Exam and Result Management System.

Endpoints:

EXAMS:
GET    /api/v1/exams                        — all exams
POST   /api/v1/exams                        — create exam schedule
GET    /api/v1/exams/{id}                   — exam details
PUT    /api/v1/exams/{id}                   — update
DELETE /api/v1/exams/{id}                   — delete
POST   /api/v1/exams/{id}/publish           — publish results

RESULTS:
POST   /api/v1/exams/{id}/results           — enter results (bulk by subject)
PUT    /api/v1/exams/{id}/results/{id}      — update single result
GET    /api/v1/exams/{id}/results           — all results for exam
GET    /api/v1/exams/{id}/results/class/{id} — class results with ranking

REPORT CARDS:
GET    /api/v1/report-cards/student/{id}    — student report card
GET    /api/v1/report-cards/class/{id}      — all report cards for class
GET    /api/v1/report-cards/pdf/{id}        — download PDF report card

ANALYTICS:
GET    /api/v1/exams/{id}/analytics         — pass/fail rate, top performers

Grading System (create in config):
A+ = 90-100%
A  = 80-89%
B  = 70-79%
C  = 60-69%
D  = 50-59%
F  = below 50%

Result entry request:
{
  "exam_id": "uuid",
  "subject_id": "uuid",
  "class_id": "uuid",
  "results": [
    {
      "student_id": "uuid",
      "total_marks": 100,
      "obtained_marks": 87,
      "remarks": "Good performance"
    }
  ]
}

After entering all results for an exam:
- Auto-calculate grade for each subject
- Calculate total percentage
- Determine class rank
- Generate pass/fail status

PDF Report Card should include:
- School header with logo
- Student info (name, class, roll number, session)
- Results table (subject | total | obtained | grade)
- Total marks summary
- Overall percentage and grade
- Class rank
- Teacher remarks field
- Principal signature area
- Attendance summary

Create:
- ExamController, ResultController
- ReportCardService
- GradingService (calculate grades, ranks)
- ReportCardPdfService
- All Form Requests, Resources
```

---

## PROMPT 11 — Notification System

```
Build the notification and communication system.

Create a unified notification service that sends via multiple channels.

Endpoints:
POST   /api/v1/notifications/send           — send notification
POST   /api/v1/notifications/broadcast      — broadcast to all/class
GET    /api/v1/notifications                — notification history
GET    /api/v1/notifications/my             — my notifications (student/parent)
PUT    /api/v1/notifications/{id}/read      — mark as read

Channels to support:
1. In-App notification (real-time via WebSocket)
2. WhatsApp (via WhatsApp Business API)
3. SMS (via local gateway - Twilio or Jazz SMS)
4. Email (via Resend.com)

Create NotificationService with methods:
- sendToStudent(studentId, title, message, channels[])
- sendToClass(classId, title, message, channels[])
- sendToParent(parentId, title, message, channels[])
- broadcastToAll(title, message, channels[])
- sendFeeReminder(studentId)          — automated
- sendAttendanceAlert(studentId)       — automated
- sendResultNotification(studentId)   — automated

Auto-notifications (triggered by events):
Event: FeeOverdue        → Send reminder to parent on 1st of month
Event: StudentAbsent     → Send WhatsApp to parent same day
Event: ResultPublished   → Notify all parents in class
Event: SchoolAnnouncement → Broadcast to everyone

WhatsApp message templates:
Fee Reminder:
"Assalam-o-Alaikum! {student_name} ki {month} ki fees Rs. {amount} pending hai.
Meherbani farma kar {due_date} tak jama karwa dein.
- {school_name}"

Attendance Alert:
"Assalam-o-Alaikum! Aapka bachcha {student_name} aaj {date} ko school nahi aaya.
Agar aapko koi masla hai tou school se rabta karein: {school_phone}
- {school_name}"

Create:
- NotificationController
- NotificationService (main orchestrator)
- WhatsAppChannel class
- SMSChannel class
- Database notification model
- Laravel Events: StudentMarkedAbsent, FeeOverdue, ResultPublished
- Listeners for each event
- Queue jobs for each channel
- Real-time broadcasting via Laravel Echo/Reverb
```

---

# PART 3 — NEXT.JS FRONTEND PROMPTS

---

## PROMPT 12 — Next.js Project Setup

```
Set up Next.js 15 project for the school management system frontend.

Run these commands:
npx create-next-app@latest school-saas --typescript --tailwind --eslint --app --src-dir

Install these packages:
npm install @tanstack/react-query zustand zod react-hook-form @hookform/resolvers
npm install axios dayjs recharts lucide-react next-themes
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npx shadcn@latest init
npx shadcn@latest add button input label card table dialog dropdown-menu badge
npx shadcn@latest add select textarea avatar tabs toast skeleton

Create folder structure in src/:
app/
  (auth)/
    login/
  (super-admin)/
    layout.tsx
    dashboard/
    schools/
    billing/
  (school)/
    layout.tsx
    dashboard/
    students/
    attendance/
    fees/
    exams/
    timetable/
    notifications/
    reports/
  layout.tsx
  page.tsx

components/
  ui/           (shadcn components)
  shared/       (reusable across app)
    DataTable.tsx
    PageHeader.tsx
    StatCard.tsx
    LoadingSpinner.tsx
    EmptyState.tsx
    ConfirmDialog.tsx
  super-admin/
  school/

lib/
  api.ts        (axios instance with interceptors)
  utils.ts      (helper functions)
  constants.ts

hooks/
  useAuth.ts
  useTenant.ts

stores/
  authStore.ts   (zustand)
  tenantStore.ts

types/
  index.ts      (all TypeScript types)

Configure:
1. Axios instance with base URL, auth headers, error interceptor
2. React Query provider with default config
3. Auth middleware (redirect to login if no token)
4. Subdomain-based tenant detection
5. Dark mode setup with next-themes

Show all configuration files: next.config.js, tailwind.config.js, middleware.ts
```

---

## PROMPT 13 — Super Admin Dashboard UI

```
Build the Super Admin Dashboard in Next.js.

Create these pages:

1. /super-admin/dashboard
   Show stat cards:
   - Total schools (with growth %)
   - Active subscriptions
   - Monthly revenue (PKR)
   - Total students across all schools
   
   Show charts (using Recharts):
   - Schools growth (line chart, last 12 months)
   - Revenue chart (bar chart, last 6 months)
   - Plan distribution (pie chart: Basic/Standard/Premium)
   
   Show table: Recently onboarded schools (last 10)

2. /super-admin/schools
   Data table with columns:
   - School name + logo
   - Subdomain (clickable)
   - Plan badge
   - Students count
   - Status badge (Active/Suspended/Trial)
   - Trial ends / Next billing
   - Actions: View, Edit, Suspend, Delete
   
   Filters: Status, Plan, Search by name
   Button: "Onboard New School" (opens dialog)

3. /super-admin/schools/new (or dialog)
   Form fields:
   - School name (required)
   - Subdomain (auto-generated from name, editable)
   - Principal name
   - Principal email
   - Principal phone
   - City
   - Subscription plan (dropdown)
   - Billing cycle (monthly/yearly)
   
   After submit: show success with login credentials

4. /super-admin/billing
   Show all invoices in a table
   Filters: Status (paid/pending/overdue), date range
   Summary cards: Total received, Pending, Overdue

Use these design decisions:
- Sidebar navigation (collapsible)
- Dark/light mode toggle in header
- Pakistani flag + "Super Admin" in header
- All amounts in PKR format (Rs. 1,23,000)
- Dates in DD/MM/YYYY format

Use shadcn/ui components throughout.
Show complete page files with TypeScript.
```

---

## PROMPT 14 — School Dashboard UI

```
Build the main School Dashboard (for Principal/Teachers).

Layout (src/app/(school)/layout.tsx):
- Left sidebar with school logo at top
- Navigation items based on user role
- Header with user avatar, notifications bell, school name
- Main content area

Sidebar menu items:
For Principal:    Dashboard, Students, Teachers, Classes, Attendance, Fees, Exams, Timetable, Expenses, Salary, Reports, Notifications, Settings
For Teacher:      Dashboard, My Classes, Attendance, Exams, Timetable
For Accountant:   Dashboard, Fees, Expenses, Salary, Reports

1. /dashboard (Principal view)
   Stat cards row:
   - Total Students | Total Teachers | Total Classes | Today's Attendance%
   
   Second row charts:
   - Fee collection this month (progress bar: collected vs target)
   - Attendance trend (last 7 days line chart)
   
   Quick actions:
   - Mark Today's Attendance
   - Collect Fee
   - Add Student
   - Send Notification
   
   Tables:
   - Recent fee payments (last 10)
   - Students with overdue fees (top 5)
   - Upcoming exams

2. /students
   Table with:
   - Photo + Name
   - Admission No
   - Class
   - Parent phone
   - Fee status (badge: Paid/Pending/Overdue)
   - Actions: View, Edit, Fee History
   
   Search bar + filters (class, fee status)
   Buttons: Add Student, Import Excel, Export

3. /students/[id]
   Student profile page:
   - Header: Photo, name, class, admission number, status
   - Tabs: Profile | Attendance | Fees | Results | Documents
   
   Profile tab: all student details
   Attendance tab: monthly calendar view + percentage
   Fees tab: all months with status, pay button
   Results tab: exam results table

Make all tables use DataTable component.
Make all forms show validation errors.
Add loading skeletons for all data fetching.
Show complete TypeScript code.
```

---

## PROMPT 15 — Attendance Marking UI

```
Build the Attendance Marking interface.

Page: /attendance

Step 1 — Select view:
Show class cards grid:
- Class name (Grade 1-A)
- Teacher name
- Total students
- Today's status: "Not marked yet" (red) or "Marked (42/45)" (green)
- Click to mark attendance

Step 2 — Mark attendance for a class (/attendance/[classId]):
Show date picker (default: today)
Show student list as cards:
- Student photo (avatar)
- Name + roll number
- 4 toggle buttons: Present | Absent | Late | Leave
- Remarks input (shows when Late or Leave selected)

Bulk actions at top:
- "Mark All Present" button
- Show count: 30 Present, 2 Absent, 0 Late

Submit button: "Save Attendance"
After save:
- Show success toast
- Notify parents of absent students automatically
- Navigate back to class list

Attendance calendar view (/attendance/student/[id]):
- Monthly calendar
- Color coded: Green=Present, Red=Absent, Yellow=Late, Blue=Leave
- Monthly stats: Days Present / Total Working Days / Percentage

Reports tab:
- Low attendance students (below 75%)
- Class-wise comparison bar chart
- Monthly trend line chart

Use optimistic updates when marking attendance.
Auto-save progress to localStorage so data isn't lost on refresh.
Show complete Next.js page files.
```

---

## PROMPT 16 — Fee Management UI

```
Build the complete Fee Management interface.

Pages to create:

1. /fees — Fee Overview
   Summary cards:
   - Current Month Collection (Rs. X / Rs. X target)
   - Pending Amount
   - Overdue Fees
   - Today's Collection
   
   Collection progress bar per class
   Quick action: "Collect Fee" button (opens modal)
   Recent transactions table (last 20 with search)

2. Fee Collection Modal/Sheet:
   Step 1: Search student (by name or admission number)
   - Show student photo, name, class
   - Show pending months with amounts
   - Show any late fines
   
   Step 2: Select months to pay
   - Checkboxes for each pending month
   - Auto-calculate total
   - Discount input (with reason)
   - Payment method selector: Cash | JazzCash | EasyPaisa | Bank
   - Transaction ID input (for digital payments)
   
   Step 3: Confirmation
   - Summary of payment
   - Collect button
   
   After payment:
   - Show receipt preview
   - Print Receipt button
   - Share WhatsApp button (sends to parent)
   - New Payment button

3. /fees/defaulters
   Students with overdue fees:
   - Photo, name, class
   - Months overdue
   - Total overdue amount
   - Days overdue
   - Send Reminder button (WhatsApp)
   - Bulk select + Send All Reminders
   
   Sort by: Amount desc, Days overdue desc

4. /fees/structures
   Manage fee types:
   - List of fee structures with amounts
   - Add/Edit/Delete
   - Apply to all classes or specific class

5. /fees/reports
   Date range filter
   Show:
   - Total collected vs expected (bar chart per month)
   - Collection by payment method (pie chart)
   - Class-wise collection table
   - Export to Excel button

PDF Receipt preview component:
- Print-ready layout
- School header
- Student details
- Payment breakdown
- Signature area

Show complete code with TypeScript types.
```

---

# PART 4 — FLUTTER MOBILE APP

---

## PROMPT 17 — Flutter App Setup

```
Create a Flutter 3 project for the school management mobile app.
This app is for Parents and Students primarily.

Create project:
flutter create school_app --org com.schoolsaas --platforms android,ios

Install these dependencies in pubspec.yaml:
dependencies:
  flutter_riverpod: ^2.5.0
  go_router: ^13.0.0
  dio: ^5.4.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.0
  cached_network_image: ^3.3.0
  intl: ^0.19.0
  fl_chart: ^0.67.0
  flutter_local_notifications: ^17.0.0
  firebase_messaging: ^14.8.0
  image_picker: ^1.0.0
  pdf: ^3.10.0
  printing: ^5.12.0
  url_launcher: ^6.2.0
  connectivity_plus: ^6.0.0

Folder structure:
lib/
  main.dart
  app/
    router.dart
    theme.dart
  core/
    api/
      dio_client.dart
      api_endpoints.dart
    storage/
      secure_storage.dart
    utils/
      formatters.dart    (PKR format, dates)
      validators.dart
  features/
    auth/
      screens/login_screen.dart
      providers/auth_provider.dart
      repositories/auth_repository.dart
    dashboard/
    attendance/
    fees/
    results/
    notifications/
    profile/

Set up:
1. Riverpod providers
2. GoRouter with authentication guard
3. Dio with auth interceptor (auto-refresh token)
4. Firebase for push notifications
5. Pakistan timezone handling
6. PKR currency formatting (Rs. 1,23,000)
7. Dark mode support
8. Urdu font (Google Fonts: Noto Nastaliq Urdu)

Show main.dart, router.dart, theme.dart, dio_client.dart complete files.
```

---

## PROMPT 18 — Flutter Parent Dashboard

```
Build the Parent Dashboard screens in Flutter.

Screens to create:

1. LoginScreen
   - School subdomain input (or QR scan)
   - Email/phone + password
   - Remember me toggle
   - Forgot password link
   - School logo if subdomain is recognized

2. DashboardScreen (Parent)
   Show if multiple children: child switcher at top (tabs or dropdown)
   
   Cards:
   - Today's attendance status (Present/Absent) with color
   - Fee status: "Rs. X due for January" (red if overdue)
   - Next exam: "Math exam in 3 days"
   - Upcoming school event
   
   Quick links row: Attendance | Fees | Results | Notifications
   
   Recent notifications list

3. AttendanceScreen
   Monthly calendar view:
   - Green circle: Present
   - Red circle: Absent
   - Yellow circle: Late
   - Gray: Holiday/Weekend
   
   Monthly summary:
   - Present: 18/22 days
   - Percentage: 81.8%
   
   Month navigation (previous/next)

4. FeesScreen
   Current month fee status at top
   
   Tabs: Pending | Paid | All
   
   Fee card shows:
   - Month name
   - Amount
   - Due date
   - Status badge
   - Pay Now button (for pending)
   - View Receipt button (for paid)
   
   Pay Now → opens payment options:
   JazzCash | EasyPaisa | Bank Transfer
   (show account details for bank)

5. ResultsScreen
   Exam selector dropdown
   
   Result card per subject:
   - Subject name
   - Marks: 87/100
   - Grade badge: A
   - Progress bar
   
   Overall: Total%, Grade, Class Rank

6. NotificationsScreen
   List of notifications
   - Icon based on type (fee, attendance, exam, general)
   - Title + message preview
   - Time ago
   - Unread indicator (blue dot)
   - Tap to expand full message

Use Material Design 3 with school's theme color.
Show complete Dart code for all screens.
```

---

# PART 5 — DEPLOYMENT PROMPTS

---

## PROMPT 19 — Docker Setup

```
Create complete Docker setup for the school management system.

Create these files:

1. docker-compose.yml (development)
   Services:
   - laravel_app (PHP 8.3-fpm)
   - nginx (web server)
   - postgresql (database)
   - redis (cache + queues)
   - laravel_horizon (queue worker)
   - mailhog (local email testing)
   
   Networks: school_network
   Volumes: postgres_data, redis_data, storage

2. Dockerfile for Laravel (PHP 8.3)
   - php:8.3-fpm base
   - Install: pdo_pgsql, redis, gd, zip, bcmath extensions
   - Install Composer
   - Copy application files
   - Set permissions on storage/

3. nginx.conf
   - Handle subdomain routing (*.yourdomain.com → same app)
   - Pass X-Tenant header based on subdomain
   - PHP-FPM proxy
   - SSL ready
   - Gzip compression

4. docker-compose.prod.yml (production overrides)
   - No mailhog
   - Resource limits
   - Restart policies
   - Health checks

5. deploy.sh script
   - Pull latest code
   - Build Docker images
   - Run migrations
   - Clear all caches
   - Restart containers
   - Zero-downtime deployment

6. .env.example
   Show all required environment variables:
   - Database credentials
   - Redis config
   - WhatsApp API keys
   - JazzCash credentials
   - EasyPaisa credentials
   - Mail settings
   - AWS S3 keys

Show all complete files.
```

---

## PROMPT 20 — Final: Seed Data & Testing

```
Create database seeders and basic tests for the application.

SEEDERS:

1. SuperAdminSeeder
   Create one super admin:
   Email: admin@schoolsaas.com
   Password: Admin@123456

2. SubscriptionPlanSeeder
   Create 3 plans:
   - Basic: Rs. 3,000/month, 300 students, 30 teachers
   - Standard: Rs. 6,000/month, 600 students, 60 teachers
   - Premium: Rs. 10,000/month, 1500 students, 150 teachers

3. DemoSchoolSeeder (for testing)
   Create a demo tenant: "City School" → subdomain: demo
   Create users:
   - Principal: principal@demo.com / Principal@123
   - Teacher: teacher@demo.com / Teacher@123
   - Accountant: accountant@demo.com / Accountant@123
   - Student login: student@demo.com / Student@123
   - Parent: parent@demo.com / Parent@123
   
   Create: 3 classes, 5 subjects, 30 demo students
   Generate fee records for last 3 months
   Generate attendance for last 30 days

TESTS (Feature Tests):
1. AuthTest: login, logout, token refresh, invalid credentials
2. StudentTest: CRUD, admission number generation, photo upload
3. AttendanceTest: bulk mark, duplicate prevention, report generation
4. FeeTest: collection, receipt generation, fine calculation
5. TenantIsolationTest: verify one school cannot access another's data

Also create a Postman collection JSON file with all API endpoints pre-configured:
- Base URL: {{base_url}}/api/v1
- Auth token auto-save from login response
- All endpoints organized in folders
- Example request bodies

Run command at end:
php artisan db:seed
php artisan test

Show all seeder files and test files.
```

---

# BONUS — TIPS FOR VIBE CODING

```
1. Cursor mein ek kaam ek waqt mein karo
   Prompt 1 → test karo → phir Prompt 2. 
   Skip mat karo koi step.

2. Errors ko Cursor mein paste karo
   Jab koi error aaye, copy karo aur Cursor chat mein:
   "This error aa raha hai: [paste error]
   Is migration/controller mein fix karo"

3. Context dete raho
   Har naye prompt se pehle likho:
   "Humne abhi tak X bana liya hai.
   Ab Y banana hai jo Z se connect ho."

4. v0.dev se UI generate karo
   v0.dev par jao aur likho:
   "School management dashboard with sidebar,
   student table, fee status cards, using shadcn/ui"
   Generated code copy karo, Cursor mein paste karo.

5. Ek module test karo pehle
   Pehle Student module complete karo (API + UI).
   Deploy karo, test karo, phir Fee module.

6. .cursorrules file update karte raho
   Jab koi decision karo (jaise fee format),
   .cursorrules mein add karo taake AI consistent rahe.
```
