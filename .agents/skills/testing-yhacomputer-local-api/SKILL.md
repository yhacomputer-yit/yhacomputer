---
name: testing-yhacomputer-local-api
description: Test the YHA Computer Vite frontend and local Vercel-style API handlers end-to-end.
---

# YHA Computer local API testing

## Setup

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev -- --host 127.0.0.1`.
3. Use the Vite URL printed by the process, normally `http://127.0.0.1:5173`.

The Vite development server mounts the handlers from `api/` directly. A separate local API server should not be necessary.

## Primary checks

1. Open `/api/data` directly before testing the frontend.
   - With valid Turso credentials, expect JSON containing `courses`, `events`, and `reviews`.
   - Without credentials, expect JSON containing `Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars.`
   - A blank 500 response plus `ECONNREFUSED` in Vite output indicates that the request may still be reaching a broken proxy.
2. Open `/` and confirm the Premium Courses section leaves `Loading…`.
3. Check the Vite process output for `http proxy error`, `ECONNREFUSED`, or unexpected port references.
4. For admin testing, open `/admin` and verify `/api/admin` separately with a non-production test account or approved credentials.

## Visual evidence

Record direct API output and the resulting frontend state. Capture full-screen screenshots and preserve Vite process output as text evidence.

## Devin Secrets Needed

- `TURSO_DATABASE_URL`: Database URL used by local API handlers.
- `TURSO_AUTH_TOKEN`: Prefer a read-only token for public data-loading tests.
- `ADMIN_PASSWORD`: Required only for admin-flow tests.
