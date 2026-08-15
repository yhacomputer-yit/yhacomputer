# Live Web Audit Notes

## 2026-08-13 initial browser checks

- The home page at `https://www.yha-edu.tech/` loads successfully with the public navigation and catalog data.
- The live public API-backed counts shown were 6 courses, 4 events, and 0 reviews.
- The home catalog preview renders raw numeric fees (`400000`) and raw placeholder values (`0`) rather than formatted fees or a pending-data label.
- The live courses catalog also renders raw numeric fees and zero values for courses without confirmed fees.
- The courses catalog loads six Turso records and shows category filters (`All`, `Ict`, `Programming`, `Graphic design`).
- This is a confirmed presentation defect to repair in the React course card and duplicate home-page course-card presentation.

## Live endpoint checks

The public page routes `/`, `/courses`, `/courses/1`, `/events`, `/events/1`, `/reviews`, and `/admin.html` all returned HTTP 200. The read-only `/api/data` response contained arrays with 6 courses, 11 subjects, 1 session, 0 teachers, 0 course-teacher rows, 4 events, 0 reviews, and 0 notifications. No orphan subject rows and no events without IDs were found in the returned data.

The invalid contact submission (`POST /api/contact` with `{}`) correctly returned HTTP 400 with a required-fields validation message. An anonymous `GET /api/admin` returned HTTP 401, confirming the admin endpoint is not publicly readable.

The full live data payload includes very large inline event image values. This made the API audit command output noisy and indicates that future API payload-size optimization should be considered, although it did not prevent a successful response in this check.

## Confirmed live-deployment defects

The production course detail URL `https://www.yha-edu.tech/courses/1` returned a client-rendered “Course not found” state even though the live course catalog contains a course with ID `1`. This is a confirmed functional defect in the currently deployed production version.

A comparison of the remote branches found that the production `main` branch is still at commit `cb3eb5a`, while the maintained redesign branch is at commit `369ea6f`. The default branch's `CourseCard` implementation renders raw price values and does not include the newer fee formatter. The live site therefore reflects an outdated production deployment rather than the newer feature branch implementation.

## Course detail route follow-up

The prior `/courses/1` finding must be corrected: the current live API course IDs are `12` through `17`, so ID `1` is not a valid live course record. It is therefore expected that `/courses/1` produces a not-found state.

The actual live course route `/courses/12` did not render its document contents in the browser inspection. Two successive checks produced only the document title and an empty root view. This is a possible runtime/load failure in the current deployed application and requires source/HTML inspection before it can be classified conclusively.

The live API response currently returned no subjects or sessions, despite the feature branch's intended seeded schema containing relation data. This is another indication that the public production deployment/database behavior is behind the maintained feature branch and needs coordinated deployment verification.

## Additional live page checks

The live events catalog rendered four records correctly, including each event's title, descriptive copy, category tags, date, venue, duration, and photo count. Dates are inconsistent in format: the first event is stored/displayed as `June 30, 2026`, while subsequent events use ISO-like `YYYY-MM-DD` values. This is a data-presentation quality issue rather than a route failure.

The live reviews page rendered a clear empty state and did not show an error. The zero-review condition is consistent with the API data; it is not a frontend failure.

## Dependency audit

The production dependency audit found two moderate React Router advisories affecting the installed React Router 6.x range, including an open redirect/XSS advisory for `react-router-dom` 6.30.2 through 6.30.4. The audit report identifies `react-router-dom` 7.18.2 as the available remediation. A controlled upgrade and production build validation are required.
