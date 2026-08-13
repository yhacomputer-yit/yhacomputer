import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureSchema, execute, query } from "../api/_db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(projectRoot, ".env.local"));

const now = new Date().toISOString();
let created = 0;
let existing = 0;

async function findOne(sql, args) {
  const rows = await query(sql, args);
  return rows[0] || null;
}

async function insertOnce(selectSql, selectArgs, insertSql, insertArgs) {
  const row = await findOne(selectSql, selectArgs);
  if (row) {
    existing += 1;
    return row;
  }
  await execute(insertSql, insertArgs);
  created += 1;
  return findOne(selectSql, selectArgs);
}

async function seed() {
  await ensureSchema();

  const courses = {};
  const courseRows = [
    {
      key: "web",
      title: "Web Design & Development",
      description: "Build responsive websites with HTML, CSS, JavaScript, and real project workflows.",
      price: 180000,
      image: "/images/one.jpg",
      subject: "Programming",
      level: "Beginner to Intermediate",
      duration: "12 weeks",
    },
    {
      key: "python",
      title: "Python Programming",
      description: "Learn Python through practical automation, data handling, and clean coding exercises.",
      price: 160000,
      image: "/images/python.jpg",
      subject: "Programming",
      level: "Beginner",
      duration: "10 weeks",
    },
    {
      key: "flutter",
      title: "Flutter & Dart Mobile Development",
      description: "Design and build cross-platform mobile experiences with Flutter and Dart.",
      price: 220000,
      image: "/images/flutter.jpg",
      subject: "Programming",
      level: "Intermediate",
      duration: "14 weeks",
    },
    {
      key: "graphic",
      title: "Graphic Design Master Class",
      description: "Develop visual design confidence with composition, branding, Photoshop, and Illustrator.",
      price: 150000,
      image: "/images/three.jpg",
      subject: "Graphic Design",
      level: "Beginner to Advanced",
      duration: "10 weeks",
    },
  ];

  for (const course of courseRows) {
    const row = await insertOnce(
      "SELECT * FROM courses WHERE title = ? LIMIT 1",
      [course.title],
      `INSERT INTO courses
        (title, description, price, image, subject, level, duration, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course.title, course.description, course.price, course.image, course.subject, course.level, course.duration, now, now]
    );
    courses[course.key] = Number(row.id);
  }

  const subjectRows = [
    [courses.web, "HTML & CSS", "Responsive page structure and styling foundations."],
    [courses.web, "JavaScript", "Interactive interfaces and browser fundamentals."],
    [courses.python, "Python Core", "Readable code, functions, collections, and automation."],
    [courses.flutter, "Dart", "Types, widgets, state, and asynchronous programming."],
    [courses.graphic, "Visual Design", "Color, type, layout, and brand communication."],
  ];
  for (const [courseId, name, description] of subjectRows) {
    await insertOnce(
      "SELECT id FROM subjects WHERE course_id = ? AND name = ? LIMIT 1",
      [courseId, name],
      "INSERT INTO subjects (course_id, name, description, created_at) VALUES (?, ?, ?, ?)",
      [courseId, name, description, now]
    );
  }

  const sessionRows = [
    [courses.web, "Weekend Web Cohort", "Saturday 09:00", "Saturday 11:00"],
    [courses.python, "Evening Python Cohort", "Tuesday 18:30", "Tuesday 20:30"],
    [courses.flutter, "Sunday Mobile Lab", "Sunday 13:00", "Sunday 15:30"],
    [courses.graphic, "Friday Design Studio", "Friday 18:00", "Friday 20:00"],
  ];
  const sessions = {};
  for (const [courseId, name, startTime, endTime] of sessionRows) {
    const row = await insertOnce(
      "SELECT * FROM sessions WHERE course_id = ? AND name = ? LIMIT 1",
      [courseId, name],
      "INSERT INTO sessions (course_id, name, start_time, end_time, created_at) VALUES (?, ?, ?, ?, ?)",
      [courseId, name, startTime, endTime, now]
    );
    sessions[name] = Number(row.id);
  }

  const teacherRows = [
    ["Aung Kyaw", "aung.kyaw@yha-edu.tech", "+95 9 700 000 101", "Web Development", "/images/one.jpg", "Project-focused web developer and mentor."],
    ["May Thiri", "may.thiri@yha-edu.tech", "+95 9 700 000 102", "Python & Automation", "/images/two.jpg", "Python instructor focused on practical problem solving."],
    ["Ko Htet", "ko.htet@yha-edu.tech", "+95 9 700 000 103", "Mobile Development", "/images/flutter.jpg", "Mobile developer who turns ideas into usable prototypes."],
  ];
  const teachers = {};
  for (const [name, email, phone, specialization, image, bio] of teacherRows) {
    const row = await insertOnce(
      "SELECT * FROM teachers WHERE email = ? LIMIT 1",
      [email],
      "INSERT INTO teachers (name, email, phone, specialization, image, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, phone, specialization, image, bio, now]
    );
    teachers[email] = Number(row.id);
  }

  const teacherLinks = [
    [courses.web, teachers["aung.kyaw@yha-edu.tech"]],
    [courses.python, teachers["may.thiri@yha-edu.tech"]],
    [courses.flutter, teachers["ko.htet@yha-edu.tech"]],
    [courses.graphic, teachers["aung.kyaw@yha-edu.tech"]],
  ];
  for (const [courseId, teacherId] of teacherLinks) {
    await insertOnce(
      "SELECT id FROM course_teachers WHERE course_id = ? AND teacher_id = ? LIMIT 1",
      [courseId, teacherId],
      "INSERT INTO course_teachers (course_id, teacher_id, created_at) VALUES (?, ?, ?)",
      [courseId, teacherId, now]
    );
  }

  const eventRows = [
    ["Open Lab: Build Your First Website", "A guided Saturday lab for beginners who want to publish a responsive landing page.", "2026-09-05", "YHA Computer Campus", "Workshop", "Open Lab", "2 hours", "/images/one.jpg"],
    ["Python Career Q&A", "Meet instructors and ask practical questions about learning Python for work.", "2026-09-19", "Online + Yangon", "Talk", "Career Session", "90 minutes", "/images/python.jpg"],
    ["Student Design Showcase", "See how learners turn briefs into posters, identities, and digital artwork.", "2026-10-03", "YHA Computer Campus", "Showcase", "Community Event", "3 hours", "/images/three.jpg"],
  ];
  for (const [title, description, date, venue, category, eventType, duration, image] of eventRows) {
    await insertOnce(
      "SELECT id FROM events WHERE title = ? AND date = ? LIMIT 1",
      [title, date],
      `INSERT INTO events
        (title, description, date, venue, category, event_type, duration, image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, date, venue, category, eventType, duration, image, now, now]
    );
  }

  const reviewRows = [
    ["Su Su", courses.web, "The project work helped me understand how each topic connects to a real website."],
    ["Min Thant", courses.python, "The lessons are clear and the instructor explains the why behind each exercise."],
    ["Ei Ei", courses.flutter, "I started with no mobile development experience and finished a working prototype."],
  ];
  for (const [name, courseId, message] of reviewRows) {
    await insertOnce(
      "SELECT id FROM reviews WHERE name = ? AND course_id = ? AND message = ? LIMIT 1",
      [name, courseId, message],
      "INSERT INTO reviews (name, course_id, message, created_at) VALUES (?, ?, ?, ?)",
      [name, courseId, message, now]
    );
  }

  const notificationRows = [
    ["September cohort registration is open", "Weekend and evening sessions are now available for new learners.", courses.web],
    ["Free Python career Q&A", "Reserve a place for the September career session.", courses.python],
  ];
  for (const [title, message, courseId] of notificationRows) {
    await insertOnce(
      "SELECT id FROM notifications WHERE title = ? AND message = ? LIMIT 1",
      [title, message],
      "INSERT INTO notifications (title, message, course_id, is_read, created_at) VALUES (?, ?, ?, 0, ?)",
      [title, message, courseId, now]
    );
  }

  await insertOnce(
    "SELECT id FROM students WHERE student_id = ? LIMIT 1",
    ["YHA9001"],
    `INSERT INTO students
      (student_id, name, email, phone, father_name, mother_name, city, township, education, status, course_id, session_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    ["YHA9001", "Demo Student", "demo.student@example.com", "+95 9 700 000 999", "Demo Father", "Demo Mother", "Yangon", "Insein", "High School", courses.web, sessions["Weekend Web Cohort"], now, now]
  );

  const counts = {};
  for (const table of ["courses", "subjects", "sessions", "teachers", "course_teachers", "events", "reviews", "notifications", "students"]) {
    const row = await findOne(`SELECT COUNT(*) AS count FROM ${table}`);
    counts[table] = Number(row.count);
  }

  console.log(JSON.stringify({ ok: true, created, existing, counts }, null, 2));
}

seed().catch((error) => {
  console.error("Seed failed:", error.message || error);
  process.exitCode = 1;
});
