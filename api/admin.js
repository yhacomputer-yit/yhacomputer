// Password-protected serverless endpoint for managing Turso data.
// Reading data is public (see api/data.js); this endpoint additionally allows
// listing, creating, updating and deleting rows, plus reading contact
// submissions. All access requires the correct admin password.
//
// Required environment variables (set in Vercel project settings):
//   TURSO_DATABASE_URL  e.g. libsql://your-db-org.turso.io
//   TURSO_AUTH_TOKEN    a READ-WRITE Turso auth token (writes need write access)
//   ADMIN_PASSWORD      the password required to use this endpoint

// Editable columns per table. Only these columns are ever written, which also
// prevents arbitrary column names from reaching the SQL.
const TABLES = {
  courses: [
    "title",
    "description",
    "price",
    "image",
    "subject",
    "level",
    "duration",
    "highlights",
  ],
  events: [
    "title",
    "description",
    "date",
    "venue",
    "category",
    "event_type",
    "duration",
  ],
  reviews: ["name", "course_name", "message"],
  contacts: ["name", "email", "message"],
};

function toHttpUrl(url) {
  return url.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
}

function toArg(value) {
  if (value == null || value === "") return { type: "null" };
  return { type: "text", value: String(value) };
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

async function execute(sql, args) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars.");
  }
  const requests = [
    { type: "execute", stmt: { sql, args: (args || []).map(toArg) } },
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
  const first = data.results[0];
  if (first.type === "error") {
    throw new Error(first.error && first.error.message);
  }
  return first.response.result;
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "ADMIN_PASSWORD env var is not set." });
    return;
  }

  const provided =
    req.headers["x-admin-password"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    res.status(401).json({ error: "Invalid admin password." });
    return;
  }

  try {
    let body = {};
    if (req.method === "POST") {
      body = await readBody(req);
    }
    const action = req.method === "GET" ? "list" : body.action;
    const table = req.method === "GET" ? req.query.table : body.table;

    if (!TABLES[table]) {
      res.status(400).json({ error: "Unknown table: " + table });
      return;
    }
    const columns = TABLES[table];

    if (action === "list") {
      const result = await execute("SELECT * FROM " + table + " ORDER BY id DESC");
      res.status(200).json({ rows: rowsToObjects(result) });
      return;
    }

    if (action === "create") {
      const values = body.values || {};
      const used = columns.filter((c) => values[c] !== undefined);
      if (!used.length) {
        res.status(400).json({ error: "No valid fields provided." });
        return;
      }
      const placeholders = used.map(() => "?").join(", ");
      const sql =
        "INSERT INTO " +
        table +
        " (" +
        used.join(", ") +
        ") VALUES (" +
        placeholders +
        ")";
      await execute(sql, used.map((c) => values[c]));
      res.status(200).json({ ok: true });
      return;
    }

    if (action === "update") {
      const id = body.id;
      const values = body.values || {};
      if (!id) {
        res.status(400).json({ error: "Missing id." });
        return;
      }
      const used = columns.filter((c) => values[c] !== undefined);
      if (!used.length) {
        res.status(400).json({ error: "No valid fields provided." });
        return;
      }
      const sql =
        "UPDATE " +
        table +
        " SET " +
        used.map((c) => c + " = ?").join(", ") +
        " WHERE id = ?";
      await execute(sql, used.map((c) => values[c]).concat([id]));
      res.status(200).json({ ok: true });
      return;
    }

    if (action === "delete") {
      const id = body.id;
      if (!id) {
        res.status(400).json({ error: "Missing id." });
        return;
      }
      await execute("DELETE FROM " + table + " WHERE id = ?", [id]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Unknown action: " + action });
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) });
  }
}
