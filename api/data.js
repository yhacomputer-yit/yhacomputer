// Vercel serverless function: queries the Turso database server-side using
// credentials from environment variables and returns courses, events and
// reviews as JSON. The auth token never reaches the browser.
//
// Required environment variables (set them in the Vercel project settings):
//   TURSO_DATABASE_URL  e.g. libsql://your-db-org.turso.io
//   TURSO_AUTH_TOKEN    a read-only Turso auth token

function toHttpUrl(url) {
  return url.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
}

function rowsToObjects(result) {
  const cols = result.cols.map((c) => c.name);
  return result.rows.map((row) => {
    const obj = {};
    row.forEach((cell, i) => {
      obj[cols[i]] = cell == null ? null : cell.value;
    });
    return obj;
  });
}

const CACHE_TTL_MS = 60 * 1000;
let cache = { at: 0, value: null };

async function fetchFromTurso(url, token) {
  const requests = [
    { type: "execute", stmt: { sql: "SELECT * FROM courses ORDER BY id" } },
    { type: "execute", stmt: { sql: "SELECT * FROM events ORDER BY id" } },
    { type: "execute", stmt: { sql: "SELECT * FROM reviews ORDER BY id DESC" } },
    { type: "close" },
  ];

  const response = await fetch(toHttpUrl(url) + "/v2/pipeline", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    throw new Error("Turso request failed with status " + response.status);
  }

  const data = await response.json();
  const parsed = data.results.map((result) => {
    if (result.type === "error") {
      throw new Error(result.error && result.error.message);
    }
    if (result.response && result.response.type === "execute") {
      return rowsToObjects(result.response.result);
    }
    return null;
  });

  const [courses, events, reviews] = parsed;
  return { courses, events, reviews };
}

export default async function handler(req, res) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    res
      .status(500)
      .json({ error: "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars." });
    return;
  }

  const now = Date.now();
  if (cache.value && now - cache.at < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).json(cache.value);
    return;
  }

  try {
    const value = await fetchFromTurso(url, token);
    cache = { at: now, value };
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).json(value);
  } catch (err) {
    if (cache.value) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
      res.status(200).json(cache.value);
      return;
    }
    res.status(502).json({ error: String((err && err.message) || err) });
  }
}
