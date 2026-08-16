# Per-course payment model

Payments belong to the `enrollments` pivot row, not the student profile, because one student may attend many courses and each course can have a different payment state.

The enrollment payment contract will use `payment_status` values `unpaid`, `partial`, `paid`, `waived`, and `refunded`; `payment_due` and `payment_paid` numeric amounts; `payment_method`, `payment_reference`, `payment_date`, and `payment_note` text fields. Existing rows will default to `unpaid` with zero paid amount and remain compatible with the current enrollment statuses.

The Admin Dashboard will expose payment fields in the Enrollments create/edit form and show payment status in the enrollment table and each Student Details course row. The student API learning bundle will return payment fields per enrollment. Web and Flutter will display payment status and paid/due amounts on every course card without exposing any admin mutation capability.
