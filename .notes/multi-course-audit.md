# Multi-course audit

The database already has a canonical many-to-many `enrollments` table with `student_id`, `course_id`, `session_id`, status, notes, timestamps, and a unique index preventing duplicate pending/approved enrollment for the same student and course. `ensureSchema()` backfills legacy `students.course_id/session_id` into this table.

The student API learning bundle already returns all enrollment rows and all published resources for approved/completed enrollments. The Web Student Dashboard maps every enrollment and groups resources by course. The Flutter My Learning screen also maps every enrollment and groups resources by course.

The missing capability is primarily in the React Admin Dashboard: the Students table and detail dialog still use only legacy single `course_id/session_id`, the Admin client does not preload enrollments for relationship summaries, and the Enrollments page is read/update-only rather than allowing an Admin to assign another course directly. The implementation will make enrollments assignable and show all course/session/status relationships in Student rows and details while retaining legacy fields for compatibility.
