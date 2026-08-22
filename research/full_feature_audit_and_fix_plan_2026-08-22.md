# YHA Computer Full Feature Audit and Fix Plan

## Audit conclusion

The platform has a working foundation: public course discovery, student enrollment, My Learning, teacher-scoped attendance and grading, and an administrator workspace all exist. The highest-priority gaps are not missing role separation; they are **security cleanup**, **mobile learner feature parity**, and several interactions that still require too many manual steps.

## Current role-flow assessment

| Role | Current strengths | High-priority corrections |
|---|---|---|
| Student (web) | Full registration, sign-in, My Learning, resources, attendance summary, payments, and assignment submission flow | Registration step navigation should validate before advancing; no functional blocker was found. |
| Student (Flutter) | Learner-only navigation, catalog, sign-in, enrollment request, resources, notifications, My Learning, Android notification polling | Registration omits useful profile fields; cached learning notifications lose deep-link metadata; assignments can be viewed but not submitted from My Learning; attendance is summary-only; a legacy admin screen/API helper remains in the mobile source tree. |
| Teacher (web) | Assigned-course-only sign-in, course roster, bulk attendance, assignment creation, grading authorization | Grading uses browser prompts rather than an accessible in-page form; no teacher account help/profile surface. The core workflow works, so grading UX is the highest next polish item. |
| Admin (web) | Course/session setup, enrollment/payment actions, student 360° detail, teacher access activation, reminders | The protected table allowlist still includes `students.password_hash`, even though all password changes should use the dedicated password-generation flow. Teacher access management remains generic but operational. |

## Approved implementation priorities

| Priority | Fix | Why it matters | Target |
|---|---|---|---|
| P0 | Remove direct student password-hash writes from admin API | Prevents an administrator client or malformed request from writing arbitrary password-hash content. | Web/API |
| P0 | Remove unused admin client surface from the learner-only Flutter package | Keeps the mobile app explicitly student-only and reduces accidental exposure of privileged workflows. | Flutter |
| P1 | Add rich profile fields to Flutter registration | Aligns mobile onboarding with the existing student API and web registration flow. | Flutter |
| P1 | Preserve notification `course_id`, `action_url`, and timestamps in cached learner data; add safe action handling | Makes scheduled payment/attendance/admin notifications actionable on mobile. | Flutter |
| P1 | Add assignment submission/edit action to Flutter My Learning | Lets learners complete the teacher assignment workflow from the app, not only the website. | Flutter |
| P1 | Add detailed attendance history sheet to Flutter My Learning | Learners can understand attendance records rather than only seeing an aggregate percentage. | Flutter/API client |
| P2 | Replace teacher grading prompts with an in-page grading dialog | Improves desktop accessibility and reduces accidental grading mistakes. | Web |
| P2 | Add step validation to web registration navigation | Prevents users from progressing through empty required sections before submit. | Web |

## Explicitly retained architecture

1. The Flutter application is **learner-only**. Teacher and admin workflow stays on the responsive web application.
2. Turso remains the sole source of operational data. Firebase is not introduced.
3. Teacher permissions remain derived from `course_teachers`, and all writes are authorized server-side.
4. Existing `students.course_id` / `session_id` remain compatibility fields only; `enrollments` remains the canonical student-course relation.

## Deferred items that require a separate product decision

| Item | Reason for deferral |
|---|---|
| Automated payment reminders on a timed schedule | The reminder records and generation action exist, but Vercel schedule frequency and `CRON_SECRET` still require deployment-configuration confirmation. |
| QR attendance check-in | Requires a classroom operational policy, expiry window choice, and teacher supervision rule; it is not safe to add as a silent default. |
| Real payment gateway or receipt upload | Needs payment-provider and reconciliation policy decisions. |
| Teacher password-help/self-service profile | Core teacher workflow is complete; this needs identity verification policy before implementation. |

## Validation note

The local web registration route rendered responsively in browser preview. Attempting to advance with an empty first step retained the user on the step and displayed the expected inline message: “Complete your name, email, phone, and password before continuing.”

Flutter CLI and Dart CLI are unavailable in the current sandbox, so automated Flutter analyzer/test execution cannot be run here. The learner-only Flutter changes were checked by source-level contract review, including route removal for the old admin screen, method call signatures, model serialization, and existing dependency availability (`url_launcher`). They should be run with `flutter analyze` and `flutter test` in a Flutter-enabled development environment before APK release.
