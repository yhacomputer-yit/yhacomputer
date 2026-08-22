# YHA Computer Role-Based Workflow Contract

## Purpose

This contract separates the YHA Computer platform into **learner**, **teacher**, and **admin** responsibilities. The model preserves the existing student portal while introducing a least-privilege teacher workflow for attendance and assessment work.

## Canonical data boundaries

| Entity | Canonical responsibility | Compatibility note |
|---|---|---|
| `students` | Learner identity and contact profile | `course_id` and `session_id` remain legacy display fields only. Multi-course participation belongs in `enrollments`. |
| `teachers` | Teacher professional profile | Credential data must not be stored in the public teacher profile. |
| `teacher_accounts` | One private login account per teacher profile | Stores teacher code, password hash, account status, and last-login timestamp. |
| `enrollments` | Student-to-course participation, approval, session selection, and payment state | This is the canonical learner-course relation. |
| `sessions` | A named course section or timetable | It is chosen per enrollment and limits the teacher roster. |
| `course_teachers` | Teacher authorization for a course | A teacher can only view or change records for assigned courses. |
| `attendance_records` | One student attendance outcome per enrolled course/day | `marked_by_teacher_id` records the accountable teacher while `marked_by` remains a legacy audit label. |
| `assignments` | Course learning work | `created_by_teacher_id` records the teacher who published the work. |
| `assignment_submissions` | Learner work and grading result | `graded_by_teacher_id` records the accountable teacher. |

## Role permissions

| Role | May read | May write | Must not access |
|---|---|---|---|
| Learner | Own profile, approved learning material, own enrollments, own attendance, own submissions, own notifications | Own profile, pending enrollment request, own assignment submission, notification read state | Other learners, all payment operations, teacher rosters, administrative data |
| Teacher | Own profile, assigned courses, matching session rosters, related submissions and attendance records | Attendance for assigned course rosters, assignments for assigned courses, grading and feedback | Other teachers’ courses, student password data, payment totals, student guardian/NRC details |
| Admin | All operating records and aggregate reports | Course setup, teacher account activation, enrollment/payment decisions, attendance corrections, notifications and support | Password hashes and learner/teacher session tokens |

## Operating flows

### Learner

A learner registers once, submits one enrollment request for a course, waits for approval, then signs in to My Learning. Course access is based on `enrollments.status IN ('approved', 'completed')`, not the legacy course field on the student profile.

### Teacher

An administrator creates a teacher profile, assigns the teacher to one or more courses, activates a teacher account, and provides the generated teacher code/password securely. After sign-in, the teacher sees only assigned courses. For a selected course and session, the teacher marks a roster as Present, Late, Excused, or Absent. The API validates every enrollment before an attendance row can be saved.

### Admin

An admin approves enrollment, assigns a session, sets payment details, activates teacher accounts, monitors attendance completion, and corrects exceptional records. The admin can still access the detailed student profile, but routine attendance entry moves to the teacher portal.

## Migration rules

1. Existing `students.password_hash` remains supported for learner login.
2. Existing `teachers` rows gain no password field. A private `teacher_accounts` row is created only when an admin activates a teacher.
3. Existing attendance rows remain valid. New records retain the legacy `marked_by` label and additionally store `marked_by_teacher_id` where a teacher marked them.
4. Existing course-to-teacher assignments become the authorization source for teacher API calls.
5. Existing admin access remains controlled by `ADMIN_PASSWORD`; teacher and learner sessions are separate signed tokens.

## Acceptance criteria

A teacher cannot load a course roster, create attendance, create an assignment, or grade a submission for a course that is not assigned through `course_teachers`. A learner cannot see another learner’s attendance or submission. An admin can activate/deactivate teacher access without editing teacher profile data or handling password hashes directly.
