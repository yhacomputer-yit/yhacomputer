# Live deployment verification

- Deployment URL: https://yhacomputer-d89k66xp4-yha-computers-projects.vercel.app/
- Homepage loads, but course/event/review data falls back to temporary-unavailable states.
- Direct request to `/api/data` returns HTTP 503 JSON: `{"error":"Unable to load live course data from Turso."}`.
- Browser console reports CSP `frame-src 'none'` blocking `https://vercel.live/`.
- Browser console reports CSP `connect-src` missing `https://region1.google-analytics.com`, blocking Google Analytics collection.
- Browser console reports `apple-mobile-web-app-capable` meta tag deprecated; should use `mobile-web-app-capable`.
- Repository `vercel.json` currently has `connect-src 'self' https://www.google-analytics.com https://*.turso.io https://api.turso.tech`, `frame-src 'none'`, and `script-src` includes `https://vercel.live`.
- Likely API root cause is a Turso runtime/configuration or schema/bootstrap failure; next step is to inspect Vercel deployment logs and environment/configuration before changing API fallback behavior.
