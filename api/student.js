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
    `SELECT DISTINCT r.id, r.course_id, r.subject_id, r.title, r.resource_type, r.url, r.note, r.lesson, r.week, r.file_size, r.download_count, r.sort_order, r.created_at, r.updated_at,
        c.title AS course_title, c.subject AS course_subject
       FROM resources r
       JOIN courses c ON c.id = r.course_id
       JOIN enrollments e ON e.course_id = r.course_id
      WHERE e.student_id = ?
        AND e.status IN ('approved', 'completed')
        AND r.is_published = 1
      ORDER BY r.course_id, r.sort_order ASC, r.id ASC`,
    [student.id]
  );
  const now = new Date().toISOString();
  const notifications = await query(`SELECT n.id, n.title, n.message, n.course_id, n.priority, n.action_url, n.publish_at, n.expires_at, n.created_at, CASE WHEN nr.notification_id IS NULL THEN 0 ELSE 1 END AS is_read FROM notifications n LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.student_id = ? WHERE (n.student_id = ? OR n.student_id IS NULL) AND (n.publish_at IS NULL OR n.publish_at <= ?) AND (n.expires_at IS NULL OR n.expires_at > ?) ORDER BY is_read ASC, n.created_at DESC, n.id DESC LIMIT 50`, [student.id, student.id, now, now]);
  const attendanceSummary = await query("SELECT course_id, COUNT(*) AS total, SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) AS attended FROM attendance_records WHERE student_id = ? GROUP BY course_id", [student.id]);
  const assignments = await query(`SELECT DISTINCT a.id, a.course_id, c.title AS course_title, a.subject_id, a.title, a.description, a.due_date, a.max_score, a.resource_url, a.status, s.id AS submission_id, s.submission_url, s.submission_note, s.submitted_at, s.score, s.feedback, s.status AS submission_status FROM assignments a JOIN courses c ON c.id = a.course_id JOIN enrollments e ON e.student_id = ? AND e.course_id = a.course_id AND e.status IN ('approved','completed') LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = ? WHERE a.status = 'published' ORDER BY a.due_date IS NULL, a.due_date ASC, a.id DESC`, [student.id, student.id]);
  return { student: safeStudent(student), enrollments, resources, notifications, attendance_summary: attendanceSummary, assignments };
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
  const now = new Date().toISOString();
  const rows = await query(
    `SELECT n.id, n.title, n.message, n.course_id, n.priority, n.action_url, n.publish_at, n.expires_at, n.created_at,
            CASE WHEN nr.notification_id IS NULL THEN 0 ELSE 1 END AS is_read
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.student_id = ?
      WHERE (n.student_id = ? OR n.student_id IS NULL)
        AND (n.publish_at IS NULL OR n.publish_at <= ?)
        AND (n.expires_at IS NULL OR n.expires_at > ?)
      ORDER BY is_read ASC, CASE n.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, n.created_at DESC, n.id DESC
      LIMIT 50`,
    [student.id, student.id, now, now]
  );
  return { notifications: rows };
}

async function markNotificationRead(req, body) {
  const student = await studentFromToken(req);
  const notificationId = optionalId(body.notification_id, "Notification");
  if (notificationId == null) throw new Error("Select a notification.");
  await execute("INSERT OR REPLACE INTO notification_reads (notification_id, student_id, read_at) SELECT id, ?, ? FROM notifications WHERE id = ? AND (student_id = ? OR student_id IS NULL)", [student.id, new Date().toISOString(), notificationId, student.id]);
  return studentNotifications(req);
}

async function downloadResource(req, body) {
  const student = await studentFromToken(req);
  const resourceId = optionalId(body.resource_id, "Resource");
  if (resourceId == null) throw new Error("Select a resource.");
  const rows = await query("SELECT r.id, r.url FROM resources r JOIN enrollments e ON e.course_id = r.course_id WHERE r.id = ? AND e.student_id = ? AND e.status IN ('approved','completed') AND r.is_published = 1 LIMIT 1", [resourceId, student.id]);
  if (!rows.length || !rows[0].url) throw new Error("Resource is unavailable.");
  await execute("UPDATE resources SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?", [resourceId]);
  return { url: rows[0].url };
}

async function studentAttendance(req) {
  const student = await studentFromToken(req);
  const rows = await query(`SELECT a.id, a.enrollment_id, a.course_id, c.title AS course_title, a.session_id, a.attendance_date, a.status, a.note FROM attendance_records a JOIN courses c ON c.id = a.course_id WHERE a.student_id = ? ORDER BY a.attendance_date DESC, a.id DESC`, [student.id]);
  const summary = await query("SELECT course_id, COUNT(*) AS total, SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) AS attended FROM attendance_records WHERE student_id = ? GROUP BY course_id", [student.id]);
  return { attendance: rows, attendance_summary: summary };
}

async function studentAssignments(req) {
  const student = await studentFromToken(req);
  const rows = await query(`SELECT a.id, a.course_id, c.title AS course_title, a.subject_id, a.title, a.description, a.due_date, a.max_score, a.resource_url, a.status, s.id AS submission_id, s.submission_url, s.submission_note, s.submitted_at, s.score, s.feedback, s.status AS submission_status FROM assignments a JOIN courses c ON c.id = a.course_id JOIN enrollments e ON e.student_id = ? AND e.course_id = a.course_id AND e.status IN ('approved','completed') LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = ? WHERE a.status = 'published' ORDER BY a.due_date IS NULL, a.due_date ASC, a.id DESC`, [student.id, student.id]);
  return { assignments: rows };
}

async function submitAssignment(req, body) {
  const student = await studentFromToken(req);
  const assignmentId = optionalId(body.assignment_id, "Assignment");
  if (assignmentId == null) throw new Error("Select an assignment.");
  const assignment = await query("SELECT id, course_id FROM assignments WHERE id = ? AND status = 'published' LIMIT 1", [assignmentId]);
  if (!assignment.length) throw new Error("Assignment not found.");
  const enrollment = await query("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status IN ('approved','completed') LIMIT 1", [student.id, assignment[0].course_id]);
  if (!enrollment.length) throw new Error("You are not enrolled in this assignment's course.");
  const submissionUrl = optionalText(body.submission_url, "Submission link", 2000);
  const submissionNote = optionalText(body.submission_note, "Submission note", 3000);
  if (!submissionUrl && !submissionNote) throw new Error("Add a submission link or note.");
  const now = new Date().toISOString();
  await execute("INSERT INTO assignment_submissions (assignment_id, student_id, enrollment_id, submission_url, submission_note, submitted_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?) ON CONFLICT(assignment_id, student_id) DO UPDATE SET submission_url = excluded.submission_url, submission_note = excluded.submission_note, submitted_at = excluded.submitted_at, status = 'submitted', updated_at = excluded.updated_at", [assignmentId, student.id, enrollment[0].id, submissionUrl, submissionNote, now, now, now]);
  return studentAssignments(req);
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
    } else if (action === "mark_notification_read") {
      payload = await markNotificationRead(req, body);
    } else if (action === "download_resource") {
      payload = await downloadResource(req, body);
    } else if (action === "attendance") {
      payload = await studentAttendance(req);
    } else if (action === "assignments") {
      payload = await studentAssignments(req);
    } else if (action === "submit_assignment") {
      payload = await submitAssignment(req, body);
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
