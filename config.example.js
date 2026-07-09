// Copy this file to `config.js` and fill in your Turso credentials.
// NOTE: `config.js` is git-ignored so your token is not committed.
// Because this is a static site, any token placed here is publicly
// visible to anyone who views the deployed page. Use a READ-ONLY token.
//
// Create a read-only token with the Turso CLI:
//   turso db tokens create <your-db-name> --read-only
window.YHA_CONFIG = {
  // Your database URL. Both libsql:// and https:// forms are accepted.
  TURSO_DATABASE_URL: "libsql://your-db-name-org.turso.io",
  // A read-only Turso auth token.
  TURSO_AUTH_TOKEN: "your-read-only-token",
};
