import { applyCors, handleCorsPreflight } from "./_cors.js";
import { ensureSchema, execute, hashPassword, passwordNeedsUpgrade, query, verifyPassword } from "./_db.js";

const MAX_BODY_BYTES = 60_000;
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const ATTENDANCE_STATUSES = new Set(["present", "absent", "late", "excused"]);
const ASSIGNMENT_STATUSES = new Set(["draft", "published", "closed"]);
const SUBMISSION_STATUSES = new Set(["submitted", "graded", "returned"]);

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
      try { resolve(JSON.parse(raw)); } catch (_) { reject(new Error("Invalid JSON body.")); }
    });
    req.on("error", reject);
  });
}

function text(value) { return String(value ?? "").trim(); }
function requiredText(value, field, maxLength) {
  const normalized = text(value);
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > maxLength) throw new Error(`${field} is too long.`);
  return normalized;
}
function optionalText(value, field, maxLength) {
  if (value == null) return null;
  const normalized = text(value);
  if (normalized.length > maxLength) throw new Error(`${field} is too long.`);
  return normalized || null;
}
function requiredId(value, field) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${field} is required.`);
  return parsed;
}
function dateOnly(value, field = "Attendance date") {
  const normalized = text(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) {
    throw new Error(`${field} must be a valid date.`);
  }
  return normalized;
}
function authToken(req) { return String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim(); }
function sessionSecret() { return process.env.TEACHER_SESSION_SECRET || process.env.STUDENT_SESSION_SECRET || process.env.TURSO_WRITE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || ""; }
function sign(payload) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Teacher session signing is not configured.");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}
function createToken(account) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: Number(account.id), tid: Number(account.teacher_id), role: "teacher", iat: now, exp: now + SESSION_TTL_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function verifyToken(token) {
  const [payload, supplied] = String(token || "").split(".");
  if (!payload || !supplied) throw new Error("Teacher sign in is required.");
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new Error("Your teacher session is invalid. Please sign in again.");
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.role !== "teacher" || !Number.isInteger(decoded.sub) || !Number.isInteger(decoded.tid) || Number(decoded.exp) <= Math.floor(Date.now() / 1000)) throw new Error();
    return decoded;
  } catch (_) {
    throw new Error("Your teacher session is invalid. Please sign in again.");
  }
}

async function teacherFromToken(req) {
  const token = verifyToken(authToken(req));
  const rows = await query(`SELECT a.id AS account_id, a.teacher_id, a.teacher_code, a.status AS account_status,
    t.name, t.email, t.phone, t.specialization, t.image, t.bio
    FROM teacher_accounts a JOIN teachers t ON t.id = a.teacher_id
    WHERE a.id = ? AND a.teacher_id = ? AND a.status = 'active' LIMIT 1`, [token.sub, token.tid]);
  if (!rows.length) throw new Error("Your teacher account is not active.");
  return rows[0];
}

async function assignedCourse(teacherId, courseId) {
  const id = requiredId(courseId, "Course");
  const rows = await query(`SELECT c.id, c.title, c.description, c.level, c.duration
    FROM courses c JOIN course_teachers ct ON ct.course_id = c.id
    WHERE ct.teacher_id = ? AND c.id = ? LIMIT 1`, [teacherId, id]);
  if (!rows.length) throw new Error("You are not assigned to this course.");
  return rows[0];
}

async function teacherCourses(teacherId) {
  return query(`SELECT c.id, c.title, c.description, c.level, c.duration, c.image,
    COUNT(DISTINCT e.id) AS enrolled_students,
    COUNT(DISTINCT s.id) AS session_count
    FROM courses c
    JOIN course_teachers ct ON ct.course_id = c.id
    LEFT JOIN enrollments e ON e.course_id = c.id AND e.status IN ('approved', 'completed')
    LEFT JOIN sessions s ON s.course_id = c.id
    WHERE ct.teacher_id = ?
    GROUP BY c.id
    ORDER BY c.title COLLATE NOCASE`, [teacherId]);
}

async function teacherDashboard(teacher) {
  const [courses, sessions, pendingAttendance, submissions] = await Promise.all([
    teacherCourses(teacher.teacher_id),
    query(`SELECT s.id, s.course_id, s.name, s.start_time, s.end_time
      FROM sessions s JOIN course_teachers ct ON ct.course_id = s.course_id
      WHERE ct.teacher_id = ? ORDER BY s.course_id, s.name COLLATE NOCASE`, [teacher.teacher_id]),
    query(`SELECT e.course_id, c.title AS course_title, COUNT(*) AS learner_count
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      JOIN course_teachers ct ON ct.course_id = e.course_id AND ct.teacher_id = ?
      WHERE e.status IN ('approved', 'completed')
        AND NOT EXISTS (SELECT 1 FROM attendance_records a WHERE a.enrollment_id = e.id AND a.attendance_date = date('now'))
      GROUP BY e.course_id, c.title
      ORDER BY c.title COLLATE NOCASE`, [teacher.teacher_id]),
    query(`SELECT sub.id, sub.status, sub.submitted_at, a.title AS assignment_title, c.title AS course_title,
      s.name AS student_name, s.student_id AS student_code
      FROM assignment_submissions sub
      JOIN assignments a ON a.id = sub.assignment_id
      JOIN courses c ON c.id = a.course_id
      JOIN students s ON s.id = sub.student_id
      JOIN course_teachers ct ON ct.course_id = a.course_id AND ct.teacher_id = ?
      WHERE sub.status IN ('submitted', 'returned')
      ORDER BY sub.submitted_at DESC, sub.id DESC LIMIT 20`, [teacher.teacher_id]),
  ]);
  return { teacher: { teacher_id: Number(teacher.teacher_id), teacher_code: teacher.teacher_code, name: teacher.name, email: teacher.email || "", specialization: teacher.specialization || "", image: teacher.image || "" }, courses, sessions, pending_attendance: pendingAttendance, submissions };
}

async function courseRoster(teacher, body) {
  const courseId = requiredId(body.course_id, "Course");
  const sessionId = body.session_id == null || body.session_id === "" ? null : requiredId(body.session_id, "Session");
  const attendanceDate = dateOnly(body.attendance_date || new Date().toISOString().slice(0, 10));
  const course = await assignedCourse(teacher.teacher_id, courseId);
  if (sessionId != null) {
    const sessions = await query("SELECT id FROM sessions WHERE id = ? AND course_id = ? LIMIT 1", [sessionId, courseId]);
    if (!sessions.length) throw new Error("Selected session does not belong to this course.");
  }
  const rows = await query(`SELECT e.id AS enrollment_id, e.student_id, e.session_id, s.student_id AS student_code,
    s.name AS student_name, s.phone AS student_phone, a.id AS attendance_id, a.status AS attendance_status, a.note AS attendance_note
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    LEFT JOIN attendance_records a ON a.enrollment_id = e.id AND a.attendance_date = ?
    WHERE e.course_id = ? AND e.status IN ('approved', 'completed')
      AND (? IS NULL OR e.session_id = ?)
    ORDER BY s.name COLLATE NOCASE`, [attendanceDate, courseId, sessionId, sessionId]);
  return { course, attendance_date: attendanceDate, session_id: sessionId, roster: rows };
}

async function saveAttendance(teacher, body) {
  const courseId = requiredId(body.course_id, "Course");
  const sessionId = body.session_id == null || body.session_id === "" ? null : requiredId(body.session_id, "Session");
  const attendanceDate = dateOnly(body.attendance_date);
  const records = Array.isArray(body.records) ? body.records : [];
  if (!records.length || records.length > 250) throw new Error("Provide between 1 and 250 attendance records.");
  await assignedCourse(teacher.teacher_id, courseId);
  if (sessionId != null) {
    const sessions = await query("SELECT id FROM sessions WHERE id = ? AND course_id = ? LIMIT 1", [sessionId, courseId]);
    if (!sessions.length) throw new Error("Selected session does not belong to this course.");
  }
  const enrollmentIds = records.map((record) => requiredId(record.enrollment_id, "Enrollment"));
  if (new Set(enrollmentIds).size !== enrollmentIds.length) throw new Error("Each learner may appear only once in an attendance save.");
  const roster = await query(`SELECT id, student_id, session_id FROM enrollments
    WHERE course_id = ? AND status IN ('approved', 'completed') AND (? IS NULL OR session_id = ?)
      AND id IN (${enrollmentIds.map(() => "?").join(",")})`, [courseId, sessionId, sessionId, ...enrollmentIds]);
  if (roster.length !== enrollmentIds.length) throw new Error("One or more learners do not belong to this assigned course/session.");
  const byEnrollment = new Map(roster.map((row) => [Number(row.id), row]));
  const now = new Date().toISOString();
  for (const record of records) {
    const enrollmentId = requiredId(record.enrollment_id, "Enrollment");
    const attendanceStatus = text(record.status).toLowerCase();
    if (!ATTENDANCE_STATUSES.has(attendanceStatus)) throw new Error("Invalid attendance status.");
    const enrollment = byEnrollment.get(enrollmentId);
    const note = optionalText(record.note, "Attendance note", 1000);
    await execute(`INSERT INTO attendance_records
      (enrollment_id, student_id, course_id, session_id, attendance_date, status, note, marked_by, marked_by_teacher_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(enrollment_id, attendance_date) DO UPDATE SET
        session_id = excluded.session_id, status = excluded.status, note = excluded.note,
        marked_by = excluded.marked_by, marked_by_teacher_id = excluded.marked_by_teacher_id, updated_at = excluded.updated_at`,
      [enrollmentId, enrollment.student_id, courseId, sessionId, attendanceDate, attendanceStatus, note, `teacher:${teacher.teacher_code}`, teacher.teacher_id, now, now]);
  }
  return { ok: true, saved: records.length, attendance_date: attendanceDate };
}

async function teacherAssignments(teacher, body) {
  const courseId = body.course_id == null || body.course_id === "" ? null : requiredId(body.course_id, "Course");
  if (courseId != null) await assignedCourse(teacher.teacher_id, courseId);
  return query(`SELECT a.*, c.title AS course_title, sub.name AS subject_name,
    COUNT(DISTINCT ss.id) AS submission_count,
    SUM(CASE WHEN ss.status = 'graded' THEN 1 ELSE 0 END) AS graded_count
    FROM assignments a
    JOIN courses c ON c.id = a.course_id
    JOIN course_teachers ct ON ct.course_id = a.course_id AND ct.teacher_id = ?
    LEFT JOIN subjects sub ON sub.id = a.subject_id
    LEFT JOIN assignment_submissions ss ON ss.assignment_id = a.id
    WHERE (? IS NULL OR a.course_id = ?)
    GROUP BY a.id
    ORDER BY a.due_date IS NULL, a.due_date ASC, a.id DESC`, [teacher.teacher_id, courseId, courseId]);
}

async function createAssignment(teacher, body) {
  const courseId = requiredId(body.course_id, "Course");
  await assignedCourse(teacher.teacher_id, courseId);
  const subjectId = body.subject_id == null || body.subject_id === "" ? null : requiredId(body.subject_id, "Subject");
  if (subjectId != null) {
    const subjects = await query("SELECT id FROM subjects WHERE id = ? AND course_id = ? LIMIT 1", [subjectId, courseId]);
    if (!subjects.length) throw new Error("Selected subject does not belong to this course.");
  }
  const title = requiredText(body.title, "Assignment title", 180);
  const description = optionalText(body.description, "Assignment description", 5000);
  const resourceUrl = optionalText(body.resource_url, "Resource URL", 2000);
  const dueDate = body.due_date ? new Date(body.due_date).toISOString() : null;
  if (body.due_date && Number.isNaN(Date.parse(body.due_date))) throw new Error("Due date must be valid.");
  const maxScore = body.max_score == null || body.max_score === "" ? 100 : Number.parseInt(String(body.max_score), 10);
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 10000) throw new Error("Maximum score must be between 1 and 10000.");
  const status = text(body.status || "published").toLowerCase();
  if (!ASSIGNMENT_STATUSES.has(status)) throw new Error("Invalid assignment status.");
  const now = new Date().toISOString();
  await execute(`INSERT INTO assignments (course_id, subject_id, title, description, due_date, max_score, resource_url, created_by_teacher_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [courseId, subjectId, title, description, dueDate, maxScore, resourceUrl, teacher.teacher_id, status, now, now]);
  return { ok: true };
}

async function assignmentSubmissions(teacher, body) {
  const assignmentId = requiredId(body.assignment_id, "Assignment");
  const rows = await query(`SELECT a.id, a.course_id FROM assignments a
    JOIN course_teachers ct ON ct.course_id = a.course_id AND ct.teacher_id = ?
    WHERE a.id = ? LIMIT 1`, [teacher.teacher_id, assignmentId]);
  if (!rows.length) throw new Error("You are not assigned to this assignment's course.");
  const submissions = await query(`SELECT s.*, st.name AS student_name, st.student_id AS student_code
    FROM assignment_submissions s JOIN students st ON st.id = s.student_id
    WHERE s.assignment_id = ? ORDER BY COALESCE(s.submitted_at, s.updated_at) DESC, s.id DESC`, [assignmentId]);
  return { assignment_id: assignmentId, submissions };
}

async function gradeSubmission(teacher, body) {
  const submissionId = requiredId(body.submission_id, "Submission");
  const rows = await query(`SELECT s.id, a.id AS assignment_id, a.max_score FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN course_teachers ct ON ct.course_id = a.course_id AND ct.teacher_id = ?
    WHERE s.id = ? LIMIT 1`, [teacher.teacher_id, submissionId]);
  if (!rows.length) throw new Error("You are not allowed to grade this submission.");
  const score = Number.parseInt(String(body.score), 10);
  if (!Number.isInteger(score) || score < 0 || score > Number(rows[0].max_score || 100)) throw new Error("Score is outside the assignment range.");
  const feedback = optionalText(body.feedback, "Feedback", 5000);
  const status = text(body.status || "graded").toLowerCase();
  if (!SUBMISSION_STATUSES.has(status)) throw new Error("Invalid submission status.");
  const now = new Date().toISOString();
  await execute("UPDATE assignment_submissions SET score = ?, feedback = ?, status = ?, graded_at = ?, graded_by = ?, graded_by_teacher_id = ?, updated_at = ? WHERE id = ?", [score, feedback, status, now, `teacher:${teacher.teacher_code}`, teacher.teacher_id, now, submissionId]);
  return { ok: true };
}

async function login(body) {
  const code = requiredText(body.teacher_code, "Teacher code", 40).toUpperCase();
  const password = requiredText(body.password, "Password", 200);
  const rows = await query(`SELECT a.*, t.name, t.email, t.specialization, t.image
    FROM teacher_accounts a JOIN teachers t ON t.id = a.teacher_id
    WHERE a.teacher_code = ? LIMIT 1`, [code]);
  if (!rows.length || rows[0].status !== "active" || !rows[0].password_hash || !verifyPassword(password, rows[0].password_hash)) {
    throw new Error("Teacher code or password is incorrect.");
  }
  const now = new Date().toISOString();
  const account = rows[0];
  const updates = ["last_login_at = ?", "updated_at = ?"];
  const args = [now, now];
  if (passwordNeedsUpgrade(account.password_hash)) { updates.unshift("password_hash = ?"); args.unshift(hashPassword(password)); }
  args.push(account.id);
  await execute(`UPDATE teacher_accounts SET ${updates.join(", ")} WHERE id = ?`, args);
  return { token: createToken(account), teacher: { teacher_id: Number(account.teacher_id), teacher_code: account.teacher_code, name: account.name, email: account.email || "", specialization: account.specialization || "", image: account.image || "" } };
}

export default async function handler(req, res) {
  const methods = ["GET", "POST", "OPTIONS"];
  if (handleCorsPreflight(req, res, methods)) return;
  applyCors(req, res, methods);
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    await ensureSchema();
    const body = req.method === "POST" ? await readBody(req) : req.query || {};
    const action = text(body.action || (req.method === "GET" ? "dashboard" : ""));
    if (action === "login") { res.status(200).json(await login(body)); return; }
    const teacher = await teacherFromToken(req);
    let payload;
    if (action === "dashboard") payload = await teacherDashboard(teacher);
    else if (action === "roster") payload = await courseRoster(teacher, body);
    else if (action === "save_attendance") payload = await saveAttendance(teacher, body);
    else if (action === "assignments") payload = { assignments: await teacherAssignments(teacher, body) };
    else if (action === "create_assignment") payload = await createAssignment(teacher, body);
    else if (action === "submissions") payload = await assignmentSubmissions(teacher, body);
    else if (action === "grade_submission") payload = await gradeSubmission(teacher, body);
    else { res.status(400).json({ error: "Unknown teacher action." }); return; }
    res.status(200).json(payload);
  } catch (error) {
    const message = String(error?.message || error);
    const status = /not found/i.test(message) ? 404 : /not assigned|not allowed|sign in|required|not active/i.test(message) ? 403 : 400;
    res.status(status).json({ error: message });
  }
}
