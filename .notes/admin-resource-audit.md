# Live Admin audit

- `https://www.yha-edu.tech/admin.html` loads successfully.
- The user-provided Admin password authenticated successfully; the page shows `Log out` and the live Courses list.
- The Admin sidebar contains `Course resources`, `Enrollment requests`, `Students`, `Password help`, and other management tabs.
- A click intended for Students landed on `Password help` because the Students tab was not among the viewport's current indexed interactive elements; the page displayed Password-help requests with 0 records.
- Need use a fresh visible-index mapping or direct coordinates to test Students and Course resources separately.
