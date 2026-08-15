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
import { applyCors, handleCorsPreflight } from "./_cors.js";
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
    "is_published",
    "featured",
    "sort_order",
    "enrollment_open",
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
  notifications: ["title", "message", "course_id", "priority", "action_url", "publish_at", "expires_at"],
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










const NOTIFICATION_PRIORITIES = new Set(["normal", "high", "urgent"]);

function optionalText(value, field, maxLength) {
  if (value == null) return null;
  const normalized = String(value).trim();
  if (normalized.length > maxLength) {
    throw new Error(`${field} is too long.`);
  }
  return normalized || null;
}

function requiredText(value, field, maxLength) {
  const normalized = optionalText(value, field, maxLength);
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function booleanFlag(value, field) {
  if (value === true || value === 1 || value === "1" || value === "true") return 1;
  if (value === false || value === 0 || value === "0" || value === "false") return 0;
  throw new Error(`${field} must be 0 or 1.`);
}

function nonNegativeInteger(value, field) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative whole number.`);
  }
  return parsed;
}

function nullableId(value, field) {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} must be a valid record id.`);
  }
  return parsed;
}

function normalizedIsoDate(value, field) {
  if (value == null || value === "") return null;
  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid date and time.`);
  return new Date(parsed).toISOString();
}

function safeActionUrl(value) {
  const url = optionalText(value, "Action URL", 1000);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return parsed.toString();
  } catch (_) {
    // The common error below is clearer than the URL parser message.
  }
  throw new Error("Action URL must be a relative path or an HTTPS URL.");
}

async function ensureCourseExists(courseId) {
  if (courseId == null) return;
  const rows = await query("SELECT id FROM courses WHERE id = ? LIMIT 1", [courseId]);
  if (!rows.length) throw new Error("Selected course does not exist.");
}

async function normalizeManagedValues(table, values, { creating = false } = {}) {
  const normalized = { ...values };

  if (table === "courses") {
    if (creating || normalized.title !== undefined) {
      normalized.title = requiredText(normalized.title, "Course title", 160);
    }
    for (const field of ["description", "image", "subject", "level", "duration"]) {
      if (normalized[field] !== undefined) {
        normalized[field] = optionalText(normalized[field], field, field === "description" ? 8000 : 1000);
      }
    }
    if (normalized.price !== undefined) normalized.price = nonNegativeInteger(normalized.price, "Price");
    for (const field of ["is_published", "featured", "enrollment_open"]) {
      if (normalized[field] !== undefined) normalized[field] = booleanFlag(normalized[field], field);
    }
    if (normalized.sort_order !== undefined) {
      normalized.sort_order = nonNegativeInteger(normalized.sort_order, "Sort order");
    }
  }

  if (table === "notifications") {
    if (creating || normalized.title !== undefined) {
      normalized.title = requiredText(normalized.title, "Notification title", 140);
    }
    if (creating || normalized.message !== undefined) {
      normalized.message = requiredText(normalized.message, "Notification message", 2000);
    }
    if (normalized.course_id !== undefined) {
      normalized.course_id = nullableId(normalized.course_id, "Course");
      await ensureCourseExists(normalized.course_id);
    }
    if (normalized.priority !== undefined) {
      normalized.priority = String(normalized.priority).trim().toLowerCase() || "normal";
      if (!NOTIFICATION_PRIORITIES.has(normalized.priority)) {
        throw new Error("Notification priority must be normal, high, or urgent.");
      }
    } else if (creating) {
      normalized.priority = "normal";
    }
    if (normalized.action_url !== undefined) normalized.action_url = safeActionUrl(normalized.action_url);
    if (normalized.publish_at !== undefined) normalized.publish_at = normalizedIsoDate(normalized.publish_at, "Publish time");
    if (normalized.expires_at !== undefined) normalized.expires_at = normalizedIsoDate(normalized.expires_at, "Expiry time");
    if (normalized.publish_at && normalized.expires_at && normalized.expires_at <= normalized.publish_at) {
      throw new Error("Expiry time must be later than publish time.");
    }
  }

  return normalized;
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
  const methods = ["GET", "POST", "OPTIONS"];
  if (handleCorsPreflight(req, res, methods)) return;
  applyCors(req, res, methods);

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

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
      const values = await normalizeManagedValues(table, body.values || {}, { creating: true });
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
      const values = await normalizeManagedValues(table, body.values || {});
      if (!id) {
        res.status(400).json({ error: "Missing id." });
        return;
      }
      const used = columns.filter((c) => values[c] !== undefined);
      if (!used.length) {
        res.status(400).json({ error: "No valid fields provided." });
        return;
      }
      const assignments = used.map((c) => c + " = ?");
      const argumentsList = used.map((c) => values[c]);
      if (table === "courses") {
        assignments.push("updated_at = ?");
        argumentsList.push(new Date().toISOString());
      }
      const sql = "UPDATE " + table + " SET " + assignments.join(", ") + " WHERE id = ?";
      await execute(sql, argumentsList.concat([id]));
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
