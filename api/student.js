import crypto from "crypto";

import { applyCors, handleCorsPreflight } from "./_cors.js";
import {
  ensureSchema,
  execute,
  hashPassword,
  passwordNeedsUpgrade,
  query,
  verifyPassword,
} from "./_db.js";

const MAX_BODY_BYTES = 30_000;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const ACTIVE_ACCOUNT_STATUSES = new Set(["active", "completed"]);
const ENROLLMENT_STATUSES = new Set(["pending", "approved", "rejected", "cancelled", "completed"]);

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY_BYTES) reject(new Error("Request body is too large."));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function text(value) {
  return String(value ?? "").trim();
}

function optionalText(value, field, maxLength) {
  if (value == null) return null;
  const normalized = text(value);
  if (normalized.length > maxLength) throw new Error(`${field} is too long.`);
  return normalized || null;
}

function requiredText(value, field, maxLength) {
  const normalized = optionalText(value, field, maxLength);
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function optionalId(value, field) {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${field} must be a valid record id.`);
  return parsed;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sessionSecret() {
  // STUDENT_SESSION_SECRET is the dedicated production secret. The fallback keeps
  // existing deployments functional until the environment variable is configured.
  return process.env.STUDENT_SESSION_SECRET || process.env.TURSO_WRITE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || "";
}

function signSessionPayload(encodedPayload) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Student session signing is not configured.");
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function createSessionToken(student) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({
    sub: Number(student.id),
    sid: String(student.student_id),
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    v: 1,
  }));
  return `${payload}.${signSessionPayload(payload)}`;
}

function verifySessionToken(token) {
  const [payload, suppliedSignature] = String(token || "").split(".");
  if (!payload || !suppliedSignature) throw new Error("Sign in is required.");
  const expectedSignature = signSessionPayload(payload);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    throw new Error("Your sign-in session is invalid. Please sign in again.");
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Number.isInteger(decoded.sub) || decoded.sub < 1 || !decoded.sid || !decoded.exp) {
      throw new Error("Invalid session payload.");
    }
    if (Number(decoded.exp) <= Math.floor(Date.now() / 1000)) {
      throw new Error("Your sign-in session has expired. Please sign in again.");
    }
    return decoded;
  } catch (error) {
    if (/sign-in session/i.test(String(error?.message || error))) throw error;
    throw new Error("Your sign-in session is invalid. Please sign in again.");
  }
}

function authToken(req) {
  const raw = String(req.headers.authorization || "");
  return raw.replace(/^Bearer\s+/i, "").trim();
}

async function getNextStudentId() {
  const rows = await query("SELECT COALESCE(MAX(CAST(REPLACE(student_id, 'YHA', '') AS INTEGER)), 0) AS last_number FROM students");
  return "YHA" + String(Number(rows[0]?.last_number || 0) + 1).padStart(4, "0");
}

async function studentFromToken(req) {
  const session = verifySessionToken(authToken(req));
  const rows = await query(
    "SELECT * FROM students WHERE id = ? AND student_id = ? LIMIT 1",
    [session.sub, session.sid]
  );
  if (!rows.length || !ACTIVE_ACCOUNT_STATUSES.has(String(rows[0].status))) {
    throw new Error("Your account is not currently active.");
  }
  return rows[0];
}

async function findCourseForEnrollment(courseId, sessionId) {
  const courses = await query(
    "SELECT id, title, is_published, enrollment_open FROM courses WHERE id = ? LIMIT 1",
    [courseId]
  );
  if (!courses.length || Number(courses[0].is_published) !== 1) {
    throw new Error("The selected course is unavailable.");
  }
  if (Number(courses[0].enrollment_open) !== 1) {
    throw new Error("Enrollment is currently closed for this course.");
  }

  if (sessionId != null) {
    const sessions = await query("SELECT id, course_id FROM sessions WHERE id = ? LIMIT 1", [sessionId]);
    if (!sessions.length || Number(sessions[0].course_id) !== courseId) {
      throw new Error("The selected session does not belong to this course.");
    }
  }
  return courses[0];
}

function safeStudent(student) {
  return {
    id: Number(student.id),
    student_id: String(student.student_id),
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    father_name: student.father_name || "",
    mother_name: student.mother_name || "",
    nrc_number: student.nrc_number || "",
    register_date: student.register_date || "",
    enroll_date: student.enroll_date || "",
    viber_phone: student.viber_phone || "",
    city: student.city || "",
    township: student.township || "",
    birthday: student.birthday || "",
    gender: student.gender || "",
    education: student.education || "",
    image: student.image || "",
    course_id: student.course_id == null ? null : Number(student.course_id),
    session_id: student.session_id == null ? null : Number(student.session_id),
    status: student.status,
    created_at: student.created_at || null,
  };
}

async function learningBundle(student) {
  const enrollments = await query(
    `SELECT e.id, e.status, e.student_note, e.admin_note, e.payment_status, e.payment_due, e.payment_paid, e.payment_method, e.payment_reference, e.payment_date, e.payment_due_date, e.payment_paid_date, e.payment_note, e.requested_at, e.reviewed_at, e.updated_at,
        c.id AS course_id, c.title AS course_title, c.image AS course_image, c.subject AS course_subject,
        c.level AS course_level, c.duration AS course_duration, c.price AS course_price,
        s.id AS session_id, s.name AS session_name, s.start_time AS session_start_time, s.end_time AS session_end_time
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN sessions s ON s.id = e.session_id
      WHERE e.student_id = ?
      ORDER BY CASE e.status
        WHEN 'approved' THEN 0
        WHEN 'pending' THEN 1
        WHEN 'completed' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
      END, e.updated_at DESC, e.id DESC`,
    [student.id]
  );
  const resources = await query(
    `SELECT DISTINCT r.id, r.course_id, r.title, r.resource_type, r.url, r.note, r.sort_order, r.created_at, r.updated_at,
        c.title AS course_title
       FROM resources r
       JOIN courses c ON c.id = r.course_id
       JOIN enrollments e ON e.course_id = r.course_id
      WHERE e.student_id = ?
        AND e.status IN ('approved', 'completed')
        AND r.is_published = 1
      ORDER BY r.course_id, r.sort_order ASC, r.id ASC`,
    [student.id]
  );
  return { student: safeStudent(student), enrollments, resources };
}

function validPassword(value) {
  const password = text(value);
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }
  return password;
}

async function register(body) {
  const name = requiredText(body.name, "Name", 120);
  const email = requiredText(body.email, "Email", 254).toLowerCase();
  const phone = requiredText(body.phone, "Phone", 40);
  const password = validPassword(body.password);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

  const existing = await query("SELECT id FROM students WHERE lower(email) = lower(?) LIMIT 1", [email]);
  if (existing.length) throw new Error("An account already exists for this email address. Please sign in or request password help.");

  const courseId = optionalId(body.course_id, "Course");
  const sessionId = optionalId(body.session_id, "Session");
  if (courseId != null) await findCourseForEnrollment(courseId, sessionId);
  if (sessionId != null && courseId == null) throw new Error("Select a course before choosing a session.");

  const studentId = await getNextStudentId();
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO students
      (student_id, name, email, phone, father_name, mother_name, nrc_number, viber_phone, city, township, birthday, gender, education, image,
       register_date, status, course_id, session_id, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
    [
      studentId, name, email, phone,
      optionalText(body.father_name, "Father name", 120),
      optionalText(body.mother_name, "Mother name", 120),
      optionalText(body.nrc_number, "NRC number", 80),
      optionalText(body.viber_phone, "Viber phone", 40),
      optionalText(body.city, "City", 100),
      optionalText(body.township, "Township", 100),
      optionalText(body.birthday, "Birthday", 30),
      optionalText(body.gender, "Gender", 30),
      optionalText(body.education, "Education", 160),
      optionalText(body.image, "Profile image", 1000),
      now, courseId, sessionId, hashPassword(password), now, now,
    ]
  );
  const created = await query("SELECT id, student_id FROM students WHERE student_id = ? LIMIT 1", [studentId]);
  if (courseId != null && created.length) {
    await execute(
      `INSERT INTO enrollments
        (student_id, course_id, session_id, status, student_note, requested_at, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [created[0].id, courseId, sessionId, optionalText(body.student_note, "Note", 1000), now, now, now]
    );
  }
  return {
    student_id: studentId,
    message: `Your account request was sent. Your Student ID is ${studentId}. An administrator must activate your account before you can sign in.`,
  };
}

async function login(body) {
  const studentId = requiredText(body.student_id, "Student ID", 32).toUpperCase();
  const password = requiredText(body.password, "Password", 128);
  const students = await query("SELECT * FROM students WHERE student_id = ? LIMIT 1", [studentId]);
  if (!students.length || !students[0].password_hash || !verifyPassword(password, students[0].password_hash)) {
    const error = new Error("Invalid student ID or password.");
    error.statusCode = 401;
    throw error;
  }
  const student = students[0];
  if (!ACTIVE_ACCOUNT_STATUSES.has(String(student.status))) {
    const error = new Error("Your account is awaiting administrator approval. Please check again after YHA confirms your registration.");
    error.statusCode = 403;
    throw error;
  }
  if (passwordNeedsUpgrade(student.password_hash)) {
    await execute("UPDATE students SET password_hash = ?, updated_at = ? WHERE id = ?", [hashPassword(password), new Date().toISOString(), student.id]);
  }
  const bundle = await learningBundle(student);
  return { token: createSessionToken(student), ...bundle };
}

async function createEnrollment(req, body) {
  const student = await studentFromToken(req);
  const courseId = optionalId(body.course_id, "Course");
  const sessionId = optionalId(body.session_id, "Session");
  if (courseId == null) throw new Error("Select a course to enroll.");
  await findCourseForEnrollment(courseId, sessionId);

  const existing = await query(
    "SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ? AND status IN ('pending', 'approved') LIMIT 1",
    [student.id, courseId]
  );
  if (existing.length) {
    const error = new Error(existing[0].status === "approved" ? "You are already enrolled in this course." : "Your enrollment request is already awaiting review.");
    error.statusCode = 409;
    throw error;
  }
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO enrollments
      (student_id, course_id, session_id, status, student_note, requested_at, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
    [student.id, courseId, sessionId, optionalText(body.student_note, "Note", 1000), now, now, now]
  );
  return learningBundle(student);
}

async function cancelEnrollment(req, body) {
  const student = await studentFromToken(req);
  const enrollmentId = optionalId(body.enrollment_id, "Enrollment");
  if (enrollmentId == null) throw new Error("Select an enrollment request.");
  const rows = await query("SELECT id, status FROM enrollments WHERE id = ? AND student_id = ? LIMIT 1", [enrollmentId, student.id]);
  if (!rows.length) {
    const error = new Error("Enrollment request not found.");
    error.statusCode = 404;
    throw error;
  }
  if (rows[0].status !== "pending") {
    throw new Error("Only pending enrollment requests can be cancelled.");
  }
  const now = new Date().toISOString();
  await execute("UPDATE enrollments SET status = 'cancelled', updated_at = ? WHERE id = ?", [now, enrollmentId]);
  return learningBundle(student);
}

async function updateProfile(req, body) {
  const student = await studentFromToken(req);
  const fields = {
    name: optionalText(body.name, "Name", 120),
    phone: optionalText(body.phone, "Phone", 40),
    father_name: optionalText(body.father_name, "Father name", 120),
    mother_name: optionalText(body.mother_name, "Mother name", 120),
    nrc_number: optionalText(body.nrc_number, "NRC number", 80),
    viber_phone: optionalText(body.viber_phone, "Viber phone", 40),
    city: optionalText(body.city, "City", 100),
    township: optionalText(body.township, "Township", 100),
    birthday: optionalText(body.birthday, "Birthday", 30),
    gender: optionalText(body.gender, "Gender", 30),
    education: optionalText(body.education, "Education", 160),
    image: optionalText(body.image, "Profile image", 1000),
  };
  if (!fields.name || !fields.phone) throw new Error("Name and phone are required.");
  const columns = Object.keys(fields);
  const now = new Date().toISOString();
  await execute(
    `UPDATE students SET ${columns.map((column) => `${column} = ?`).join(", ")}, updated_at = ? WHERE id = ?`,
    [...columns.map((column) => fields[column]), now, student.id]
  );
  const refreshed = await query("SELECT * FROM students WHERE id = ? LIMIT 1", [student.id]);
  return learningBundle(refreshed[0]);
}

async function changePassword(req, body) {
  const student = await studentFromToken(req);
  const currentPassword = requiredText(body.current_password, "Current password", 128);
  const newPassword = validPassword(body.new_password);
  if (!verifyPassword(currentPassword, student.password_hash)) {
    const error = new Error("Your current password is incorrect.");
    error.statusCode = 401;
    throw error;
  }
  const now = new Date().toISOString();
  await execute("UPDATE students SET password_hash = ?, updated_at = ? WHERE id = ?", [hashPassword(newPassword), now, student.id]);
  return { message: "Your password was updated." };
}

async function studentNotifications(req) {
  const student = await studentFromToken(req);
  const rows = await query(
    `SELECT id, title, message, course_id, priority, action_url, publish_at, expires_at, created_at
       FROM notifications
      WHERE student_id = ?
        AND (publish_at IS NULL OR publish_at <= ?)
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, created_at DESC, id DESC
      LIMIT 50`,
    [student.id, new Date().toISOString(), new Date().toISOString()]
  );
  return { notifications: rows.map((row) => ({ ...row, is_read: 0 })) };
}

async function requestPasswordHelp(body) {
  const studentId = requiredText(body.student_id, "Student ID", 32).toUpperCase();
  const email = requiredText(body.email, "Email", 254).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

  const students = await query(
    "SELECT id FROM students WHERE student_id = ? AND lower(email) = lower(?) LIMIT 1",
    [studentId, email]
  );
  // Return the same response for all inputs to avoid revealing whether an
  // account exists. Admin can only see a request for a matching account.
  if (!students.length) {
    return { message: "If the student ID and email match an account, YHA will review the password-help request." };
  }
  const student = students[0];
  const existing = await query(
    "SELECT id FROM student_password_resets WHERE student_id = ? AND status = 'pending' LIMIT 1",
    [student.id]
  );
  if (!existing.length) {
    const now = new Date().toISOString();
    await execute(
      "INSERT INTO student_password_resets (student_id, status, requested_at, created_at, updated_at) VALUES (?, 'pending', ?, ?, ?)",
      [student.id, now, now, now]
    );
  }
  return { message: "If the student ID and email match an account, YHA will review the password-help request." };
}

export default async function handler(req, res) {
  const methods = ["GET", "POST", "OPTIONS"];
  if (handleCorsPreflight(req, res, methods)) return;
  applyCors(req, res, methods);

  if (!methods.includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    await ensureSchema();
    const body = req.method === "POST" ? await readBody(req) : {};
    const action = String(req.method === "GET" ? req.query?.action || "me" : body.action || "").trim();
    let payload;
    let status = 200;

    if (action === "register") {
      payload = await register(body);
      status = 201;
    } else if (action === "login") {
      payload = await login(body);
    } else if (action === "me") {
      payload = await learningBundle(await studentFromToken(req));
    } else if (action === "enroll") {
      payload = await createEnrollment(req, body);
      status = 201;
    } else if (action === "cancel_enrollment") {
      payload = await cancelEnrollment(req, body);
    } else if (action === "update_profile") {
      payload = await updateProfile(req, body);
    } else if (action === "change_password") {
      payload = await changePassword(req, body);
    } else if (action === "notifications") {
      payload = await studentNotifications(req);
    } else if (action === "request_password_help") {
      payload = await requestPasswordHelp(body);
    } else {
      const error = new Error("Unknown action.");
      error.statusCode = 400;
      throw error;
    }
    res.status(status).json({ ok: true, ...payload });
  } catch (error) {
    const message = String(error?.message || error);
    const status = error?.statusCode || (
      /sign in|required|session|account is not currently active/i.test(message) ? 401 :
      /already|closed|unavailable|not found/i.test(message) ? 409 : 400
    );
    res.status(status).json({ error: message });
  }
}
