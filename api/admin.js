// Password-protected serverless endpoint for managing Turso data.
// Reading data is public (see api/data.js); this endpoint additionally allows
// listing, creating, updating and deleting rows, plus reading contact
// submissions. All access requires the correct admin password.
//
// Required environment variables (set in Vercel project settings):
//   TURSO_DATABASE_URL  e.g. libsql://your-db-org.turso.io
//   TURSO_WRITE_AUTH_TOKEN a READ-WRITE Turso auth token
//   TURSO_AUTH_TOKEN       fallback token for existing deployments
//   ADMIN_PASSWORD      the password required to use this endpoint

// Editable columns per table. Only these columns are ever written, which also
// prevents arbitrary column names from reaching the SQL.
import { ensureSchema, execute, generatePassword, hashPassword, query } from "./_db.js";

const TABLES = {
  courses: [
    "title",
    "description",
    "price",
    "image",
    "subject",
    "level",
    "duration",
  ],
  subjects: [
    "course_id",
    "name",
    "description",
  ],
  sessions: [
    "course_id",
    "name",
    "start_time",
    "end_time",
  ],
  teachers: [
    "name",
    "email",
    "phone",
    "specialization",
    "image",
    "bio",
  ],
  course_teachers: [
    "course_id",
    "teacher_id",
  ],
  events: [
    "title",
    "description",
    "date",
    "venue",
    "category",
    "event_type",
    "duration",
    "image",
  ],
  reviews: ["name", "course_id", "message"],
  contacts: ["name", "email", "message"],
  notifications: ["title", "message", "course_id", "is_read"],
  students: [
    "student_id",
    "name",
    "email",
    "phone",
    "father_name",
    "mother_name",
    "nrc_number",
    "register_date",
    "enroll_date",
    "viber_phone",
    "city",
    "township",
    "birthday",
    "gender",
    "image",
    "education",
    "status",
    "course_id",
    "session_id",
    "password_hash",
    "created_at",
    "updated_at",
  ],
};










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
    await ensureSchema();
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
      const rows = await query("SELECT * FROM " + table + " ORDER BY id DESC");
      const safeRows = table === "students"
        ? rows.map(({ password_hash, ...row }) => ({ ...row, password_set: Boolean(password_hash) }))
        : rows;
      res.status(200).json({ rows: safeRows });
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

    if (action === "generate_password") {
      if (table !== "students") {
        res.status(400).json({ error: "Password generation is only available for students." });
        return;
      }
      const id = body.id;
      if (!id) {
        res.status(400).json({ error: "Missing student id." });
        return;
      }
      const newPassword = generatePassword();
      const passwordHash = hashPassword(newPassword);
      const now = new Date().toISOString();
      await execute(
        "UPDATE students SET password_hash = ?, updated_at = ? WHERE id = ?",
        [passwordHash, now, id]
      );
      res.status(200).json({
        ok: true,
        password: newPassword,
        message: "Password generated successfully.",
      });
      return;
    }

    res.status(400).json({ error: "Unknown action: " + action });
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) });
  }
}
