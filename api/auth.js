import crypto from "crypto";

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
  const token =
    process.env.TURSO_WRITE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
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

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function getNextStudentId() {
  const result = await execute(
    "SELECT student_id FROM students WHERE student_id IS NOT NULL ORDER BY student_id DESC LIMIT 1"
  );
  if (!result.rows.length) return "YHA0001";
  const lastId = result.rows[0].cols[0].value;
  const num = parseInt(lastId.replace("YHA", ""), 10);
  if (isNaN(num)) return "YHA0001";
  return "YHA" + String(num + 1).padStart(4, "0");
}

async function ensureStudentsTable() {
  try {
    await execute(
      "CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT UNIQUE, name TEXT, email TEXT, phone TEXT, father_name TEXT, mother_name TEXT, nrc_number TEXT, register_date TEXT, enroll_date TEXT, viber_phone TEXT, city TEXT, township TEXT, birthday TEXT, gender TEXT, image TEXT, education TEXT, status TEXT, course_id TEXT, session_id TEXT, password_hash TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))"
    );
  } catch (e) {
    // Table might already exist
  }
}

async function ensureSessionsTable() {
  try {
    await execute(
      "CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, start_time TEXT, end_time TEXT, created_at TEXT DEFAULT (datetime('now')))"
    );
  } catch (e) {
    // Table might already exist
  }
}

async function ensureCoursesColumns() {
  const result = await execute("PRAGMA table_info(courses)");
  const existing = rowsToObjects(result || { cols: [], rows: [] }).map(
    (row) => row.name
  );
  const needed = [
    "title",
    "description",
    "price",
    "image",
    "subject",
    "level",
    "duration",
  ];
  for (const column of needed) {
    if (!existing.includes(column)) {
      await execute(
        "ALTER TABLE courses ADD COLUMN " + column + " TEXT"
      );
    }
  }
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
  try {
    let body = {};
    if (req.method === "POST") {
      body = await readBody(req);
    }

    if (req.method === "POST" && body.action === "register") {
      await ensureStudentsTable();
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim();
      const phone = String(body.phone || "").trim();
      const fatherName = String(body.father_name || "").trim();
      const motherName = String(body.mother_name || "").trim();
      const nrcNumber = String(body.nrc_number || "").trim();
      const viberPhone = String(body.viber_phone || "").trim();
      const city = String(body.city || "").trim();
      const township = String(body.township || "").trim();
      const birthday = String(body.birthday || "").trim();
      const gender = String(body.gender || "").trim();
      const image = String(body.image || "").trim();
      const education = String(body.education || "").trim();
      const status = String(body.status || "pending").trim();
      const courseId = String(body.course_id || "").trim();
      const sessionId = String(body.session_id || "").trim();

      if (!name || !email || !phone) {
        res.status(400).json({ error: "Name, email, and phone are required." });
        return;
      }

      const studentId = await getNextStudentId();
      const now = new Date().toISOString();

      const result = await execute(
        "INSERT INTO students (student_id, name, email, phone, father_name, mother_name, nrc_number, register_date, enroll_date, viber_phone, city, township, birthday, gender, image, education, status, course_id, session_id, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          studentId,
          name,
          email,
          phone,
          fatherName,
          motherName,
          nrcNumber,
          now,
          now,
          viberPhone,
          city,
          township,
          birthday,
          gender,
          image,
          education,
          status,
          courseId,
          sessionId,
          null,
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

    if (req.method === "POST" && body.action === "login") {
      await ensureStudentsTable();
      const studentId = String(body.student_id || "").trim();
      const password = String(body.password || "").trim();

      if (!studentId || !password) {
        res.status(400).json({ error: "Student ID and password are required." });
        return;
      }

      const result = await execute(
        "SELECT * FROM students WHERE student_id = ? LIMIT 1",
        [studentId]
      );
      const students = rowsToObjects(result || { cols: [], rows: [] });
      if (!students.length) {
        res.status(401).json({ error: "Invalid student ID or password." });
        return;
      }

      const student = students[0];
      if (!student.password_hash) {
        res.status(403).json({ error: "Your account has not been activated yet. Please contact the admin." });
        return;
      }
      if (student.status !== "active") {
        res.status(403).json({ error: "Your account is pending approval. Please contact the admin." });
        return;
      }

      const passwordHash = hashPassword(password);
      if (student.password_hash !== passwordHash) {
        res.status(401).json({ error: "Invalid student ID or password." });
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
          course_id: student.course_id,
          session_id: student.session_id,
          status: student.status,
        },
      });
      return;
    }

    if (req.method === "POST" && body.action === "generate_password") {
      await ensureStudentsTable();
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

    res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    res.status(502).json({ error: String((err && err.message) || err) });
  }
}
