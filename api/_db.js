import crypto from "crypto";

const TABLE_COLUMNS = {
  courses: ["title", "description", "price", "image", "subject", "level", "duration", "is_published", "featured", "sort_order", "enrollment_open", "created_at", "updated_at"],
  subjects: ["course_id", "name", "description", "created_at"],
  resources: ["course_id", "subject_id", "title", "resource_type", "url", "note", "lesson", "week", "file_size", "download_count", "sort_order", "is_published", "created_at", "updated_at"],
  sessions: ["course_id", "name", "start_time", "end_time", "created_at"],
  teachers: ["name", "email", "phone", "specialization", "image", "bio", "created_at"],
  course_teachers: ["course_id", "teacher_id", "created_at"],
  events: ["title", "description", "date", "venue", "category", "event_type", "duration", "image", "created_at", "updated_at"],
  reviews: ["name", "course_id", "message", "created_at"],
  contacts: ["name", "email", "message", "created_at"],
  notifications: ["title", "message", "student_id", "course_id", "priority", "action_url", "publish_at", "expires_at", "is_read", "created_at"],
  students: ["student_id", "name", "email", "phone", "father_name", "mother_name", "nrc_number", "register_date", "enroll_date", "viber_phone", "city", "township", "birthday", "gender", "image", "education", "status", "course_id", "session_id", "password_hash", "created_at", "updated_at"],
  enrollments: ["student_id", "course_id", "session_id", "status", "student_note", "admin_note", "payment_status", "payment_due", "payment_paid", "payment_method", "payment_reference", "payment_date", "payment_due_date", "payment_paid_date", "payment_note", "requested_at", "reviewed_at", "reviewed_by", "created_at", "updated_at"],
  student_password_resets: ["student_id", "status", "requested_at", "resolved_at", "resolved_by", "created_at", "updated_at"],
  notification_reads: ["notification_id", "student_id", "read_at"],
  payment_reminders: ["enrollment_id", "student_id", "reminder_type", "scheduled_for", "sent_at", "status", "created_at"],
  attendance_records: ["enrollment_id", "student_id", "course_id", "session_id", "attendance_date", "status", "note", "marked_by", "created_at", "updated_at"],
  assignments: ["course_id", "subject_id", "title", "description", "due_date", "max_score", "resource_url", "status", "created_at", "updated_at"],
  assignment_submissions: ["assignment_id", "student_id", "enrollment_id", "submission_url", "submission_note", "submitted_at", "score", "feedback", "status", "graded_at", "graded_by", "created_at", "updated_at"],
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
    is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
    featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    enrollment_open INTEGER NOT NULL DEFAULT 1 CHECK (enrollment_open IN (0, 1)),
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
  `CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'file' CHECK (resource_type IN ('file', 'pdf', 'zip', 'youtube', 'note')),
    url TEXT,
    note TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    action_url TEXT,
    publish_at TEXT,
    expires_at TEXT,
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
  `CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    student_note TEXT,
    admin_note TEXT,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    payment_due INTEGER NOT NULL DEFAULT 0,
    payment_paid INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_reference TEXT,
    payment_date TEXT,
    payment_due_date TEXT,
    payment_paid_date TEXT,
    payment_note TEXT,
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    reviewed_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    read_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (notification_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS payment_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL DEFAULT 'due_soon',
    scheduled_for TEXT NOT NULL,
    sent_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    attendance_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    note TEXT,
    marked_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(enrollment_id, attendance_date)
  )`,
  `CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    max_score INTEGER NOT NULL DEFAULT 100,
    resource_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    submission_url TEXT,
    submission_note TEXT,
    submitted_at TEXT,
    score INTEGER,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    graded_at TEXT,
    graded_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(assignment_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS student_password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'cancelled')),
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    resolved_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

const INDEX_STATEMENTS = [
  "CREATE INDEX IF NOT EXISTS idx_subjects_course_id ON subjects(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_resources_course_public ON resources(course_id, is_published, sort_order, id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_course_teachers_course_id ON course_teachers(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher_id ON course_teachers(teacher_id)",
  "CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_courses_public_list ON courses(is_published, featured, sort_order, id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_public_feed ON notifications(publish_at, expires_at, id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_student_feed ON notifications(student_id, publish_at, id)",
  "CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id)",
  "CREATE INDEX IF NOT EXISTS idx_students_session_id ON students(session_id)",
  "CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)",
  "CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at)",
  "CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id, status, updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id, status, updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_enrollments_session_id ON enrollments(session_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_one_open_request ON enrollments(student_id, course_id) WHERE status IN ('pending', 'approved')",
  "CREATE INDEX IF NOT EXISTS idx_password_resets_student_status ON student_password_resets(student_id, status, requested_at DESC)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_one_pending ON student_password_resets(student_id) WHERE status = 'pending'",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_reads_pair ON notification_reads(notification_id, student_id)",
  "CREATE INDEX IF NOT EXISTS idx_payment_reminders_due ON payment_reminders(status, scheduled_for)",
  "CREATE INDEX IF NOT EXISTS idx_payment_reminders_student ON payment_reminders(student_id, status, scheduled_for)",
  "CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, attendance_date DESC)",
  "CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance_records(course_id, attendance_date DESC)",
  "CREATE INDEX IF NOT EXISTS idx_assignments_course_due ON assignments(course_id, status, due_date)",
  "CREATE INDEX IF NOT EXISTS idx_submissions_student_status ON assignment_submissions(student_id, status, updated_at DESC)",
];

function toHttpUrl(url) {
  return String(url || "").replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
}

export function toArg(value) {
  if (value == null || value === "") return { type: "null" };
  // Turso's HTTP pipeline protocol represents integer values as decimal strings.
  if (typeof value === "number" && Number.isInteger(value)) return { type: "integer", value: String(value) };
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
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error("Turso request failed with status " + response.status + ": " + errorBody.slice(0, 800));
  }
  const data = await response.json();
  const first = data.results && data.results[0];
  if (!first || first.type === "error") throw new Error(first?.error?.message || "Turso query failed.");
  return first.response.result;
}

export async function query(sql, args = []) {
  return rowsToObjects(await execute(sql, args));
}

function columnType(column) {
  const numeric = new Set(["id", "student_id", "course_id", "subject_id", "session_id", "teacher_id", "notification_id", "enrollment_id", "assignment_id", "price", "payment_due", "payment_paid", "max_uses", "used_count", "is_read", "is_published", "featured", "sort_order", "enrollment_open", "is_active", "week", "file_size", "download_count", "max_score", "score"]);
  return numeric.has(column) ? "INTEGER" : "TEXT";
}

async function addCompatibilityColumns() {
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const existing = await query(`PRAGMA table_info(${table})`);
    const names = new Set(existing.map((column) => column.name));
    for (const column of columns) {
      if (!names.has(column)) {
        const defaultValue = {
          status: " DEFAULT 'pending'",
          is_read: " DEFAULT 0",
          is_published: " DEFAULT 1",
          featured: " DEFAULT 0",
          sort_order: " DEFAULT 0",
          enrollment_open: " DEFAULT 1",
          priority: " DEFAULT 'normal'",
          payment_status: " DEFAULT 'unpaid'",
          payment_due: " DEFAULT 0",
          payment_paid: " DEFAULT 0",
          payment_due_date: "",
          payment_paid_date: "",
          download_count: " DEFAULT 0",
          week: " DEFAULT 0",
          max_score: " DEFAULT 100",
        }[column] || "";
        await execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnType(column)}${defaultValue}`);
      }
    }
  }
}

async function backfillLegacyStudentEnrollments() {
  await execute(`INSERT INTO enrollments
    (student_id, course_id, session_id, status, requested_at, reviewed_at, reviewed_by, created_at, updated_at)
    SELECT s.id,
      s.course_id,
      CASE
        WHEN s.session_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM sessions ss WHERE ss.id = s.session_id AND ss.course_id = s.course_id
        ) THEN s.session_id
        ELSE NULL
      END,
      CASE s.status
        WHEN 'active' THEN 'approved'
        WHEN 'completed' THEN 'completed'
        WHEN 'inactive' THEN 'cancelled'
        ELSE 'pending'
      END,
      COALESCE(s.register_date, s.created_at, datetime('now')),
      CASE WHEN s.status IN ('active', 'completed', 'inactive') THEN COALESCE(s.updated_at, datetime('now')) ELSE NULL END,
      CASE WHEN s.status IN ('active', 'completed', 'inactive') THEN 'legacy-migration' ELSE NULL END,
      COALESCE(s.created_at, datetime('now')),
      COALESCE(s.updated_at, datetime('now'))
    FROM students s
    WHERE s.course_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM courses c WHERE c.id = s.course_id)
      AND NOT EXISTS (
        SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.course_id = s.course_id
      )`);
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
      for (const statement of CREATE_STATEMENTS) {
        try {
          await execute(statement);
        } catch (error) {
          throw new Error("Schema table setup failed: " + statement.replace(/\\s+/g, " ").slice(0, 180) + ". " + error.message);
        }
      }
      await addCompatibilityColumns();
      await repairStudentForeignKeyTypes();
      await backfillLegacyStudentEnrollments();
      for (const statement of INDEX_STATEMENTS) {
        try {
          await execute(statement);
        } catch (error) {
          throw new Error("Schema index setup failed: " + statement + ". " + error.message);
        }
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const digest = crypto.scryptSync(String(password), salt, 32).toString("base64url");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password, storedHash) {
  const stored = String(storedHash || "");
  if (stored.startsWith("scrypt$")) {
    const [, salt, expected] = stored.split("$");
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(String(password), salt, 32).toString("base64url");
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }
  const legacy = crypto.createHash("sha256").update(String(password)).digest("hex");
  const storedBuffer = Buffer.from(stored);
  const legacyBuffer = Buffer.from(legacy);
  return storedBuffer.length === legacyBuffer.length && crypto.timingSafeEqual(storedBuffer, legacyBuffer);
}

export function passwordNeedsUpgrade(storedHash) {
  return !String(storedHash || "").startsWith("scrypt$");
}

export function generatePassword() {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

export { TABLE_COLUMNS };
