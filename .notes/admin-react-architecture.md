# React Admin Dashboard architecture

The legacy `/admin.html` and `public/admin.js` implementation will be replaced by a React route at `/admin/*`, while the existing public and student routes remain unchanged.

The Admin shell will use a persistent responsive sidebar, a top bar, route-aware breadcrumbs, a mobile drawer, and an outlet-based page surface. Routes will be grouped by feature: `/admin` for overview, `/admin/courses`, `/admin/subjects`, `/admin/resources`, `/admin/sessions`, `/admin/teachers`, `/admin/assignments`, `/admin/events`, `/admin/reviews`, `/admin/notifications`, `/admin/enrollments`, `/admin/students`, `/admin/password-help`, and `/admin/contacts`.

A shared `AdminDataPage` will handle authenticated GET/POST requests, loading/error/empty states, search, pagination, CRUD forms, dynamic course/student/session selects, and resource upload validation. Specialized student and resource pages will add details drawers, CSV export, resource type guidance, and per-course filtering. Admin authentication remains compatible with the existing `x-admin-password` header and `sessionStorage` key `yha_admin_pw`.

The design direction is a professional dark navy navigation rail with warm YHA orange accents, soft neutral workspace cards, strong table hierarchy, keyboard-focus states, and responsive layouts for tablets and phones. Existing API validation remains authoritative; the React client will provide friendly validation and error feedback without duplicating unsafe database logic.
