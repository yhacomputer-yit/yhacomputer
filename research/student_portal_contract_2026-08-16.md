# Student Portal and Enrollment Contract

**Author:** Manus AI  
**Date:** 2026-08-16

## Purpose

This contract defines a privacy-safe student experience for YHA Computer: students authenticate with their issued student ID and password, view their own profile and learning records, submit enrollment requests for open courses, and track the administrative decision. It deliberately uses no public student data, no Firebase, and no client-controlled approval state.

The information architecture follows public student-portal patterns: authenticated users view their enrolled courses in a dedicated personal course list, while enrollment requests remain distinct from approved enrollments.[1][2]

## Data model

| Record | Ownership | Key fields | Purpose |
|---|---|---|---|
| `students` | One student | profile, account status, password hash | Identity and profile details. The historical `course_id` and `session_id` fields remain for backward compatibility only. |
| `enrollments` | One student + one course/session request | `student_id`, `course_id`, `session_id`, `status`, timestamps, admin note | Canonical multi-course enrollment workflow. |
| `student_password_resets` | One student request | `student_id`, `status`, `requested_at`, `resolved_at` | Lets a student request a replacement password without exposing an account lookup endpoint. |

## Enrollment lifecycle

| Status | Set by | Student visibility | Meaning |
|---|---|---|---|
| `pending` | Student | My Learning: awaiting review | A request has been submitted; no course access is granted. |
| `approved` | Admin | My Learning: active | The learner is accepted for the course/session. |
| `rejected` | Admin | My Learning: not approved | The request was not approved. The optional admin note can explain the next step. |
| `cancelled` | Student | My Learning: cancelled | The student withdrew a pending request. |
| `completed` | Admin | My Learning: completed | The course was completed and remains in learning history. |

Only one non-final request (`pending` or `approved`) for the same student-course pair may exist. The course must be published and have `enrollment_open = 1` before the API creates a request. An optional session must belong to the selected course.

## Authentication and access control

| Operation | Authorization | Rule |
|---|---|---|
| Register | Public | Creates a pending student account; all client-provided fields are validated and bounded. |
| Login | Student ID + password | Issues a short-lived signed session token only for `active` or `completed` accounts. |
| My Learning/Profile | Signed student token | The API always derives the student ID from the token. It never accepts a client-supplied target student ID. |
| Enrollment request / cancellation / password reset request | Signed student token | The API checks the authenticated student and lifecycle transition. |
| Approve/reject/complete | Admin password | Only the protected admin endpoint may perform administrative lifecycle changes. |

Session tokens expire after seven days. The signing secret must be supplied through `STUDENT_SESSION_SECRET` in Vercel. A deployment can temporarily derive a signing key from its existing Turso authentication secret only to preserve functionality while the dedicated secret is configured; the dedicated secret is the recommended production configuration.

Passwords are stored as versioned `scrypt` hashes. The login verifier also accepts the legacy SHA-256 hash format and upgrades it after a successful login, preventing existing admin-issued credentials from breaking.

## Flutter application experience

The account area appears inside the existing **More** tab so the focused four-item bottom navigation remains unchanged. It has three states:

1. Logged out: Student login, create account, and password help.
2. Pending account: clear approval explanation plus sign-out and password-help options.
3. Authenticated: My Learning, Profile, and Password & support.

My Learning shows approved, pending, rejected, cancelled, and completed learning records with a direct course route. A course detail page shows **Enroll now** only for a signed-in learner and an open course; otherwise it guides the user to login or informs them that enrollment is closed.

## Administrative experience

A new compact **Enrollment requests** queue appears in the existing dashboard. Each row identifies the student, requested course/session, request status, date, and optional student/admin notes. Administrators can assign a compatible saved session, then approve, reject, mark complete, or cancel a request. Approving a request automatically activates that student's otherwise pending account, while the existing Students area remains available for profile management and replacement-password generation.

## References

[1]: https://help.imagineedgenuity.com/hc/en-us/articles/360043186793-Using-your-account-to-view-courses-in-the-Student-Portal "Edgenuity: Using your account to view courses in the Student Portal"
[2]: https://support-students.acadeum.com/hc/en-us/articles/4404558276627-How-Do-I-Access-Acadeum-s-Student-App "Acadeum: How do I access the Student App?"
[3]: https://help.anthology.com/blackboard/instructor/en/course-and-content-management/set-up-courses/manage-course-enrollment.html "Anthology Blackboard: Manage Course Enrollment"

## Local validation note

The local `/admin.html` preview renders the compact navigation successfully, including the new **Enrollment requests** and **Password help** queues. The protected queue contents were intentionally not opened during this layout-only check.

> Android debug APK compilation could not be run in the sandbox because no Android SDK is installed. Flutter static analysis and the Flutter test suite both pass with the new secure-storage dependency.
