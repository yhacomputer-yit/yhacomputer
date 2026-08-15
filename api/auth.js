import { applyCors, handleCorsPreflight } from "./_cors.js";
import { ensureSchema, generatePassword, hashPassword, query, execute } from "./_db.js";

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 30_000) reject(new Error("Request body is too large."));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function text(value) {
  return String(value ?? "").trim();
}

function optionalInteger(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function getNextStudentId() {
  const rows = await query("SELECT COALESCE(MAX(CAST(REPLACE(student_id, 'YHA', '') AS INTEGER)), 0) AS last_number FROM students");
  return "YHA" + String(Number(rows[0]?.last_number || 0) + 1).padStart(4, "0");
}

async function validateEnrollment(courseId, sessionId) {
  if (courseId != null) {
    const courses = await query("SELECT id FROM courses WHERE id = ? LIMIT 1", [courseId]);
    if (!courses.length) throw new Error("Selected course does not exist.");
  }
  if (sessionId != null) {
    const sessions = await query("SELECT id, course_id FROM sessions WHERE id = ? LIMIT 1", [sessionId]);
    if (!sessions.length) throw new Error("Selected session does not exist.");
    if (courseId != null && Number(sessions[0].course_id) !== Number(courseId)) {
      throw new Error("Selected session does not belong to the selected course.");
    }
  }
}

export default async function handler(req, res) {
  const methods = ["POST", "OPTIONS"];
  if (handleCorsPreflight(req, res, methods)) return;
  applyCors(req, res, methods);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const body = await readBody(req);
    await ensureSchema();

    if (body.action === "register") {
      const name = text(body.name);
      const email = text(body.email).toLowerCase();
      const phone = text(body.phone);
      if (!name || !email || !phone) {
        res.status(400).json({ error: "Name, email, and phone are required." });
        return;
      }
      if (name.length > 120 || email.length > 254 || phone.length > 40) {
        res.status(400).json({ error: "One or more fields are too long." });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        res.status(400).json({ error: "Enter a valid email address." });
        return;
      }

      const courseId = optionalInteger(body.course_id);
      const sessionId = optionalInteger(body.session_id);
      await validateEnrollment(courseId, sessionId);
      const studentId = await getNextStudentId();
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO students
          (student_id, name, email, phone, father_name, mother_name, nrc_number,
           register_date, enroll_date, viber_phone, city, township, birthday, gender,
           image, education, status, course_id, session_id, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, ?, ?)`,
        [
          studentId,
          name,
          email,
          phone,
          text(body.father_name),
          text(body.mother_name),
          text(body.nrc_number),
          now,
          now,
          text(body.viber_phone),
          text(body.city),
          text(body.township),
          text(body.birthday),
          text(body.gender),
          text(body.image),
          text(body.education),
          courseId,
          sessionId,
          now,
          now,
        ]
      );

      res.status(201).json({
        ok: true,
        student_id: studentId,
        message: "Registration successful. Your student ID is " + studentId + ". Please wait for admin approval.",
      });
      return;
    }

    if (body.action === "login") {
      const studentId = text(body.student_id).toUpperCase();
      const password = text(body.password);
      if (!studentId || !password) {
        res.status(400).json({ error: "Student ID and password are required." });
        return;
      }

      const students = await query("SELECT * FROM students WHERE student_id = ? LIMIT 1", [studentId]);
      if (!students.length || !students[0].password_hash || students[0].password_hash !== hashPassword(password)) {
        res.status(401).json({ error: "Invalid student ID or password." });
        return;
      }
      const student = students[0];
      if (student.status !== "active") {
        res.status(403).json({ error: "Your account is pending approval. Please contact the admin." });
        return;
      }

      res.status(200).json({
        ok: true,
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          course_id: student.course_id == null ? null : Number(student.course_id),
          session_id: student.session_id == null ? null : Number(student.session_id),
          status: student.status,
        },
      });
      return;
    }

    if (body.action === "generate_password") {
      const expected = process.env.ADMIN_PASSWORD;
      const provided = req.headers["x-admin-password"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!expected || provided !== expected) {
        res.status(401).json({ error: "Admin authorization is required." });
        return;
      }
      const id = optionalInteger(body.id);
      if (!id) {
        res.status(400).json({ error: "Missing student id." });
        return;
      }
      const newPassword = generatePassword();
      const now = new Date().toISOString();
      await execute("UPDATE students SET password_hash = ?, updated_at = ? WHERE id = ?", [hashPassword(newPassword), now, id]);
      res.status(200).json({ ok: true, password: newPassword, message: "Password generated successfully." });
      return;
    }

    res.status(400).json({ error: "Unknown action." });
  } catch (error) {
    const message = String(error?.message || error);
    const status = /selected (course|session)/i.test(message) ? 400 : 502;
    res.status(status).json({ error: message });
  }
}
