# Production promotion update

The Admin reliability fix commit `92c4942` was promoted to production. Vercel deployment `9Nv9EA6j64pXUrX4bDdDUSqyBKJe` is `Ready`, `Production`, and currently assigned to `www.yha-edu.tech`.

The fix adds explicit table-switch state reset, clears stale list content, catches form-render errors, adds a resources help message, and installs delegated `.admin-tab` click handling. Next step is to verify the live Course Resources and Students detail flows after a fresh navigation.

## 2026-08-16 final verification finding

After promoting commits `a0ccb47`, `0294e43`, `f7df6c1`, and `7be9629`, the live HTML/JS markers on `www.yha-edu.tech` show the native Course Resources link and URL-driven initialization code. However, loading `/admin.html?table=resources` in the connected browser still renders the Courses workspace, so the tab-switch issue is not yet verified as resolved. The production code path now sets `currentTable` from the URL in `showManage()` and retries `selectTable()` after 250 ms, but the browser result still displays Courses. Do not claim final resolution until this behavior is reproduced/fixed.
