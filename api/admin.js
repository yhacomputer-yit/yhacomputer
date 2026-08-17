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
  resources: [
    "course_id",
    "subject_id",
    "title",
    "resource_type",
    "url",
    "note",
    "lesson",
    "week",
    "file_size",
    "download_count",
    "sort_order",
    "is_published",
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
  notifications: [
    "title",
    "message",
    "student_id", "course_id", "priority", "action_url", "publish_at", "expires_at"],
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
  enrollments: ["student_id", "course_id", "session_id", "status", "student_note", "admin_note", "payment_status", "payment_due", "payment_paid", "payment_method", "payment_reference", "payment_date", "payment_due_date", "payment_paid_date", "payment_note"],
  student_password_resets: ["status", "resolved_at", "resolved_by"],
  payment_reminders: ["enrollment_id", "student_id", "reminder_type", "scheduled_for", "sent_at", "status"],
  attendance_records: ["enrollment_id", "student_id", "course_id", "session_id", "attendance_date", "status", "note", "marked_by"],
  assignments: ["course_id", "subject_id", "title", "description", "due_date", "max_score", "resource_url", "status"],
  assignment_submissions: ["assignment_id", "student_id", "enrollment_id", "submission_url", "submission_note", "submitted_at", "score", "feedback", "status", "graded_at", "graded_by"],
};










const NOTIFICATION_PRIORITIES = new Set(["normal", "high", "urgent"]);
const ENROLLMENT_STATUSES = new Set(["pending", "approved", "rejected", "cancelled", "completed"]);
const PASSWORD_RESET_STATUSES = new Set(["pending", "resolved", "cancelled"]);

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

async function ensureStudentExists(studentId) {
  if (studentId == null) return;
  const rows = await query("SELECT id FROM students WHERE id = ? LIMIT 1", [studentId]);
  if (!rows.length) throw new Error("Selected student does not exist.");
}

async function ensureSessionMatchesCourse(sessionId, courseId) {
  if (sessionId == null) return;
  const rows = await query("SELECT id, course_id FROM sessions WHERE id = ? LIMIT 1", [sessionId]);
  if (!rows.length) throw new Error("Selected session does not exist.");
  if (courseId != null && Number(rows[0].course_id) !== Number(courseId)) {
    throw new Error("Selected session does not belong to the selected course.");
  }
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

  if (table === "resources") {
    for (const field of ["course_id", "subject_id"]) if (normalized[field] !== undefined) normalized[field] = nullableId(normalized[field], field === "course_id" ? "Course" : "Subject");
    for (const field of ["title", "url", "note", "lesson"]) if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, field === "note" ? 3000 : 1000);
    if (normalized.week !== undefined) normalized.week = nonNegativeInteger(normalized.week, "Week");
    if (normalized.file_size !== undefined) normalized.file_size = nonNegativeInteger(normalized.file_size, "File size");
    if (normalized.download_count !== undefined) normalized.download_count = nonNegativeInteger(normalized.download_count, "Download count");

    if (creating || normalized.course_id !== undefined) {
      normalized.course_id = nullableId(normalized.course_id, "Course");
      if (normalized.course_id == null) throw new Error("Course is required.");
      await ensureCourseExists(normalized.course_id);
    }
    if (creating || normalized.title !== undefined) {
      normalized.title = requiredText(normalized.title, "Resource title", 180);
    }
    if (normalized.resource_type !== undefined) {
      normalized.resource_type = String(normalized.resource_type).trim().toLowerCase();
      if (!["file", "pdf", "zip", "youtube", "note"].includes(normalized.resource_type)) {
        throw new Error("Resource type must be file, pdf, zip, youtube, or note.");
      }
    } else if (creating) {
      normalized.resource_type = "file";
    }
    for (const field of ["url", "note"]) {
      if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, field === "note" ? 8000 : 2200000);
    }
    if (normalized.sort_order !== undefined) normalized.sort_order = nonNegativeInteger(normalized.sort_order, "Display order");
    if (normalized.is_published !== undefined) normalized.is_published = booleanFlag(normalized.is_published, "Visible to students");
  }

  if (table === "enrollments") {
    if (creating || normalized.student_id !== undefined) {
      normalized.student_id = nullableId(normalized.student_id, "Student");
      if (normalized.student_id == null) throw new Error("Student is required.");
      await ensureStudentExists(normalized.student_id);
    }
    if (creating || normalized.course_id !== undefined) {
      normalized.course_id = nullableId(normalized.course_id, "Course");
      if (normalized.course_id == null) throw new Error("Course is required.");
      await ensureCourseExists(normalized.course_id);
    }
    if (normalized.session_id !== undefined) {
      normalized.session_id = nullableId(normalized.session_id, "Session");
      await ensureSessionMatchesCourse(normalized.session_id, normalized.course_id);
    }
    if (normalized.status !== undefined) {
      normalized.status = String(normalized.status).trim().toLowerCase();
      if (!ENROLLMENT_STATUSES.has(normalized.status)) throw new Error("Invalid enrollment status.");
    } else if (creating) {
      normalized.status = "pending";
    }
    for (const field of ["student_note", "admin_note", "payment_method", "payment_reference", "payment_note"]) {
      if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, 1000);
    }
    if (normalized.payment_status !== undefined) {
      normalized.payment_status = String(normalized.payment_status).trim().toLowerCase();
      if (!["unpaid", "partial", "paid", "waived", "refunded"].includes(normalized.payment_status)) throw new Error("Invalid payment status.");
    } else if (creating) {
      normalized.payment_status = "unpaid";
    }
    for (const field of ["payment_due", "payment_paid"]) {
      if (normalized[field] !== undefined) normalized[field] = nonNegativeInteger(normalized[field], field === "payment_due" ? "Payment due" : "Payment paid");
    }
    if (normalized.payment_due_date !== undefined) normalized.payment_due_date = normalized.payment_due_date ? normalizedIsoDate(normalized.payment_due_date, "Payment due date") : null;
    if (normalized.payment_paid_date !== undefined) normalized.payment_paid_date = normalized.payment_paid_date ? normalizedIsoDate(normalized.payment_paid_date, "Payment paid date") : null;
    if (normalized.payment_date !== undefined) normalized.payment_date = normalized.payment_date ? normalizedIsoDate(normalized.payment_date, "Payment date") : null;
    const due = Number(normalized.payment_due ?? 0);
    const paid = Number(normalized.payment_paid ?? 0);
    if (normalized.payment_status !== "waived" && normalized.payment_status !== "refunded") {
      normalized.payment_status = due > 0 && paid >= due ? "paid" : paid > 0 ? "partial" : "unpaid";
      if (normalized.payment_status === "paid" && normalized.payment_paid_date === undefined && normalized.payment_date === undefined) normalized.payment_paid_date = new Date().toISOString();
    }
  }

  if (table === "payment_reminders") {
    for (const field of ["enrollment_id", "student_id"]) if (normalized[field] !== undefined) normalized[field] = nullableId(normalized[field], field);
    if (normalized.scheduled_for !== undefined) normalized.scheduled_for = normalizedIsoDate(normalized.scheduled_for, "Scheduled time");
    if (normalized.sent_at !== undefined) normalized.sent_at = normalized.sent_at ? normalizedIsoDate(normalized.sent_at, "Sent time") : null;
    for (const field of ["reminder_type", "status"]) if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, 40);
  }
  if (table === "attendance_records") {
    for (const field of ["enrollment_id", "student_id", "course_id", "session_id"]) if (normalized[field] !== undefined) normalized[field] = nullableId(normalized[field], field);
    if (normalized.attendance_date !== undefined) normalized.attendance_date = normalizedIsoDate(normalized.attendance_date, "Attendance date");
    if (normalized.status !== undefined && !["present", "absent", "late", "excused"].includes(String(normalized.status).toLowerCase())) throw new Error("Invalid attendance status.");
    for (const field of ["note", "marked_by"]) if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, 1000);
  }
  if (table === "assignments") {
    if (creating || normalized.title !== undefined) normalized.title = requiredText(normalized.title, "Assignment title", 180);
    for (const field of ["course_id", "subject_id"]) if (normalized[field] !== undefined) normalized[field] = nullableId(normalized[field], field);
    for (const field of ["description", "resource_url"]) if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, 5000);
    if (normalized.due_date !== undefined) normalized.due_date = normalized.due_date ? normalizedIsoDate(normalized.due_date, "Due date") : null;
    if (normalized.max_score !== undefined) normalized.max_score = nonNegativeInteger(normalized.max_score, "Maximum score");
    if (normalized.status !== undefined && !["draft", "published", "closed"].includes(String(normalized.status).toLowerCase())) throw new Error("Invalid assignment status.");
  }
  if (table === "assignment_submissions") {
    for (const field of ["assignment_id", "student_id", "enrollment_id"]) if (normalized[field] !== undefined) normalized[field] = nullableId(normalized[field], field);
    for (const field of ["submission_url", "submission_note", "feedback", "graded_by"]) if (normalized[field] !== undefined) normalized[field] = optionalText(normalized[field], field, 5000);
    for (const field of ["submitted_at", "graded_at"]) if (normalized[field] !== undefined) normalized[field] = normalized[field] ? normalizedIsoDate(normalized[field], field) : null;
    if (normalized.score !== undefined) normalized.score = nonNegativeInteger(normalized.score, "Score");
    if (normalized.status !== undefined && !["draft", "submitted", "graded", "returned"].includes(String(normalized.status).toLowerCase())) throw new Error("Invalid submission status.");
  }
  if (table === "student_password_resets") {
    if (normalized.status !== undefined) {
      normalized.status = String(normalized.status).trim().toLowerCase();
      if (!PASSWORD_RESET_STATUSES.has(normalized.status)) throw new Error("Invalid password-help request status.");
    }
    if (normalized.resolved_by !== undefined) normalized.resolved_by = optionalText(normalized.resolved_by, "Resolved by", 120);
    if (normalized.resolved_at !== undefined) normalized.resolved_at = normalizedIsoDate(normalized.resolved_at, "Resolved time");
  }

  if (table === "notifications") {
    if (creating || normalized.title !== undefined) {
      normalized.title = requiredText(normalized.title, "Notification title", 140);
    }
    if (creating || normalized.message !== undefined) {
      normalized.message = requiredText(normalized.message, "Notification message", 2000);
    }
    if (normalized.student_id !== undefined) {
      normalized.student_id = nullableId(normalized.student_id, "Student");
      await ensureStudentExists(normalized.student_id);
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

async function createStudentNotification({ studentId, title, message, courseId = null, priority = "high" }) {
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO notifications (title, message, student_id, course_id, priority, publish_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, message, studentId, courseId, priority, now, now]
  );
}

async function generatePaymentReminders() {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const current = now.toISOString();
  const rows = await query(`SELECT e.id, e.student_id, e.course_id, e.payment_due_date, e.payment_due, e.payment_paid, c.title AS course_title, s.name AS student_name FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN students s ON s.id = e.student_id WHERE e.payment_status IN ('unpaid','partial') AND e.payment_due > e.payment_paid AND e.payment_due_date IS NOT NULL AND e.payment_due_date <= ? AND e.status IN ('approved','completed')`, [cutoff]);
  let created = 0;
  for (const row of rows) {
    const overdue = String(row.payment_due_date) < current;
    const type = overdue ? 'overdue' : 'due_soon';
    const exists = await query("SELECT id FROM payment_reminders WHERE enrollment_id = ? AND reminder_type = ? AND created_at >= date('now') LIMIT 1", [row.id, type]);
    if (exists.length) continue;
    await execute("INSERT INTO payment_reminders (enrollment_id, student_id, reminder_type, scheduled_for, status, created_at) VALUES (?, ?, ?, ?, 'sent', ?)", [row.id, row.student_id, type, current, current]);
    await createStudentNotification({ studentId: row.student_id, courseId: row.course_id, priority: overdue ? 'urgent' : 'high', title: overdue ? 'Payment overdue' : 'Payment due soon', message: `${row.course_title}: your remaining balance is ${Math.max(0, Number(row.payment_due || 0) - Number(row.payment_paid || 0)).toLocaleString()}. ${overdue ? 'Please contact YHA Computer about this overdue payment.' : 'Please complete payment by the due date.'}` });
    created += 1;
  }
  return { created, checked: rows.length };
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
    if (action === "generate_payment_reminders") {
      res.status(200).json(await generatePaymentReminders());
      return;
    }
    const table = req.method === "GET" ? req.query.table : body.table;

    if (!TABLES[table]) {
      res.status(400).json({ error: "Unknown table: " + table });
      return;
    }
    const columns = TABLES[table];

    if (action === "list") {
      let rows;
      if (table === "enrollments") {
        rows = await query(`SELECT e.*, s.student_id AS student_code, s.name AS student_name, s.email AS student_email,
          s.phone AS student_phone, c.title AS course_title, c.price AS course_price, se.name AS session_name
          FROM enrollments e
          JOIN students s ON s.id = e.student_id
          JOIN courses c ON c.id = e.course_id
          LEFT JOIN sessions se ON se.id = e.session_id
          ORDER BY CASE e.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
            e.updated_at DESC, e.id DESC`);
      } else if (table === "student_password_resets") {
        rows = await query(`SELECT r.*, s.student_id AS student_code, s.name AS student_name, s.email AS student_email,
          s.phone AS student_phone
          FROM student_password_resets r
          JOIN students s ON s.id = r.student_id
          ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.requested_at DESC, r.id DESC`);
      } else {
        rows = await query("SELECT * FROM " + table + " ORDER BY id DESC");
      }
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
      const previousRows = table === "students"
        ? await query("SELECT id, student_id, name, status FROM students WHERE id = ? LIMIT 1", [id])
        : table === "enrollments"
          ? await query("SELECT e.id, e.student_id, e.course_id, e.status, s.student_id AS student_code, s.name AS student_name, c.title AS course_title FROM enrollments e JOIN students s ON s.id = e.student_id JOIN courses c ON c.id = e.course_id WHERE e.id = ? LIMIT 1", [id])
          : [];
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
      const now = new Date().toISOString();
      if (table === "courses" || table === "resources" || table === "enrollments" || table === "student_password_resets" || table === "students") {
        assignments.push("updated_at = ?");
        argumentsList.push(now);
      }
      if (table === "enrollments" && values.status !== undefined && values.status !== "pending") {
        assignments.push("reviewed_at = ?");
        argumentsList.push(now);
        assignments.push("reviewed_by = ?");
        argumentsList.push("admin");
      }
      if (table === "student_password_resets" && values.status === "resolved") {
        assignments.push("resolved_at = ?");
        argumentsList.push(now);
        assignments.push("resolved_by = ?");
        argumentsList.push("admin");
      }
      const sql = "UPDATE " + table + " SET " + assignments.join(", ") + " WHERE id = ?";
      await execute(sql, argumentsList.concat([id]));
      if (table === "enrollments" && values.status === "approved") {
        // Approval is the deliberate admin decision that grants both course
        // access and the ability to sign in for a newly registered learner.
        await execute(
          "UPDATE students SET status = 'active', updated_at = ? WHERE id = (SELECT student_id FROM enrollments WHERE id = ?) AND status = 'pending'",
          [now, id]
        );
        const previous = previousRows[0];
        if (previous && previous.status !== "approved") {
          await createStudentNotification({
            studentId: previous.student_id,
            courseId: previous.course_id,
            title: "Course enrollment approved",
            message: `Your enrollment request for ${previous.course_title} has been approved. You can now access your course from the student portal.`,
          });
        }
      }
      if (table === "students" && values.status === "active") {
        const previous = previousRows[0];
        if (previous && previous.status !== "active") {
          await createStudentNotification({
            studentId: previous.id,
            title: "Student profile approved",
            message: `Your YHA student profile has been approved. The admin will generate or provide your password so you can sign in with Student ID ${previous.student_id}.`,
          });
        }
      }
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
      await execute(
        "UPDATE student_password_resets SET status = 'resolved', resolved_at = ?, resolved_by = ?, updated_at = ? WHERE student_id = ? AND status = 'pending'",
        [now, "admin", now, id]
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
