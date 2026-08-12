import crypto from "crypto";

const TABLE_COLUMNS = {
  courses: ["title", "description", "price", "image", "subject", "level", "duration", "highlights", "created_at", "updated_at"],
  subjects: ["course_id", "name", "description", "created_at"],
  sessions: ["course_id", "name", "start_time", "end_time", "created_at"],
  teachers: ["name", "email", "phone", "specialization", "image", "bio", "created_at"],
  course_teachers: ["course_id", "teacher_id", "created_at"],
  events: ["title", "description", "date", "venue", "category", "event_type", "duration", "image", "created_at", "updated_at"],
  reviews: ["name", "course_id", "message", "created_at"],
  contacts: ["name", "email", "message", "created_at"],
  notifications: ["title", "message", "course_id", "is_read", "created_at"],
  students: ["student_id", "name", "email", "phone", "father_name", "mother_name", "nrc_number", "register_date", "enroll_date", "viber_phone", "city", "township", "birthday", "gender", "image", "education", "status", "course_id", "session_id", "password_hash", "created_at", "updated_at"],
};

const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    subject TEXT,
    level TEXT,
    duration TEXT,
    highlights TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    image TEXT,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS course_teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(course_id, teacher_id)
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    venue TEXT,
    category TEXT,
    event_type TEXT,
    duration TEXT,
    image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    nrc_number TEXT,
    register_date TEXT,
    enroll_date TEXT,
    viber_phone TEXT,
    city TEXT,
    township TEXT,
    birthday TEXT,
    gender TEXT,
    image TEXT,
    education TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'completed')),
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    password_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  "CREATE INDEX IF NOT EXISTS idx_subjects_course_id ON subjects(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_course_teachers_course_id ON course_teachers(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher_id ON course_teachers(teacher_id)",
  "CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_students_session_id ON students(session_id)",
  "CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)",
  "CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at)",
];

function toHttpUrl(url) {
  return String(url || "").replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
}

export function toArg(value) {
  if (value == null || value === "") return { type: "null" };
  if (typeof value === "number" && Number.isInteger(value)) return { type: "integer", value };
  if (typeof value === "number") return { type: "float", value };
  return { type: "text", value: String(value) };
}

export function rowsToObjects(result) {
  const cols = (result && result.cols) || [];
  const rows = (result && result.rows) || [];
  return rows.map((row) => {
    const object = {};
    row.forEach((cell, index) => {
      object[cols[index].name] = cell == null ? null : cell.value;
    });
    return object;
  });
}

export async function execute(sql, args = []) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_WRITE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars.");

  const response = await fetch(toHttpUrl(url) + "/v2/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: args.map(toArg) } },
        { type: "close" },
      ],
    }),
  });
  if (!response.ok) throw new Error("Turso request failed with status " + response.status);
  const data = await response.json();
  const first = data.results && data.results[0];
  if (!first || first.type === "error") throw new Error(first?.error?.message || "Turso query failed.");
  return first.response.result;
}

export async function query(sql, args = []) {
  return rowsToObjects(await execute(sql, args));
}

function columnType(column) {
  const numeric = new Set(["id", "course_id", "session_id", "teacher_id", "price", "is_read"]);
  return numeric.has(column) ? "INTEGER" : "TEXT";
}

async function addCompatibilityColumns() {
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const existing = await query(`PRAGMA table_info(${table})`);
    const names = new Set(existing.map((column) => column.name));
    for (const column of columns) {
      if (!names.has(column)) {
        const defaultValue = column === "status" ? " DEFAULT 'pending'" : column === "is_read" ? " DEFAULT 0" : "";
        await execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnType(column)}${defaultValue}`);
      }
    }
  }
}

async function repairStudentForeignKeyTypes() {
  const info = await query("PRAGMA table_info(students)");
  const courseColumn = info.find((column) => column.name === "course_id");
  const sessionColumn = info.find((column) => column.name === "session_id");
  if (!courseColumn || !sessionColumn) return;
  if (!/TEXT/i.test(String(courseColumn.type)) && !/TEXT/i.test(String(sessionColumn.type))) return;

  await execute("PRAGMA foreign_keys = OFF");
  await execute(`CREATE TABLE IF NOT EXISTS students_repair (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    nrc_number TEXT,
    register_date TEXT,
    enroll_date TEXT,
    viber_phone TEXT,
    city TEXT,
    township TEXT,
    birthday TEXT,
    gender TEXT,
    image TEXT,
    education TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    password_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  await execute(`INSERT OR IGNORE INTO students_repair
    (id, student_id, name, email, phone, father_name, mother_name, nrc_number, register_date, enroll_date, viber_phone, city, township, birthday, gender, image, education, status, course_id, session_id, password_hash, created_at, updated_at)
    SELECT id, student_id, COALESCE(name, ''), COALESCE(email, ''), COALESCE(phone, ''), father_name, mother_name, nrc_number, register_date, enroll_date, viber_phone, city, township, birthday, gender, image, education, COALESCE(status, 'pending'),
      CASE WHEN CAST(course_id AS INTEGER) > 0 AND EXISTS (SELECT 1 FROM courses c WHERE c.id = CAST(students.course_id AS INTEGER)) THEN CAST(course_id AS INTEGER) ELSE NULL END,
      CASE WHEN CAST(session_id AS INTEGER) > 0 AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = CAST(students.session_id AS INTEGER)) THEN CAST(session_id AS INTEGER) ELSE NULL END,
      password_hash, COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
    FROM students`);
  await execute("DROP TABLE students");
  await execute("ALTER TABLE students_repair RENAME TO students");
  await execute("CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id)");
  await execute("CREATE INDEX IF NOT EXISTS idx_students_session_id ON students(session_id)");
  await execute("CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)");
  await execute("PRAGMA foreign_keys = ON");
}

let schemaPromise = null;
export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const statement of CREATE_STATEMENTS) await execute(statement);
      await addCompatibilityColumns();
      await repairStudentForeignKeyTypes();
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

export function generatePassword() {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

export { TABLE_COLUMNS };
