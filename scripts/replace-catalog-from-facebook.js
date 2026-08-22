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

const SOURCE_PAGES = [
  "https://www.facebook.com/yhacomputerforyou/",
  "https://www.facebook.com/yhaacademytech",
];

const now = new Date().toISOString();
const courses = [
  {
    title: "Web Design & Development (FullStack Class)",
    description: "A beginner-friendly FullStack Web Development class covering programming concepts, front-end development, PHP, databases, and an individual final project.",
    price: 400000,
    subject: "Programming",
    level: "Beginner",
    duration: "3 months",
  },
  {
    title: "Flutter & Dart Mobile Development Class",
    description: null,
    price: 0,
    subject: "Programming",
    level: null,
    duration: null,
  },
  {
    title: "Python Programming Class",
    description: null,
    price: 0,
    subject: "Programming",
    level: null,
    duration: null,
  },
  {
    title: "MERN Stack Development Class",
    description: null,
    price: 0,
    subject: "Programming",
    level: null,
    duration: null,
  },
  {
    title: "Laravel + Vue Development Class",
    description: null,
    price: 0,
    subject: "Programming",
    level: null,
    duration: null,
  },
  {
    title: "C# Programming Class",
    description: null,
    price: 0,
    subject: "Programming",
    level: null,
    duration: null,
  },
];

const webSubjects = [
  ["Programming Concepts", "Beginner-focused programming foundations."],
  ["HTML & CSS", "Build page structure and styling from the ground up."],
  ["Bootstrap", "Use Bootstrap for responsive interfaces."],
  ["UI Design with Figma", "Design interfaces with Figma before implementation."],
  ["JavaScript", "Learn browser scripting fundamentals."],
  ["jQuery", "Use jQuery for common interface interactions."],
  ["Ajax, JSON & API", "Work with asynchronous requests, JSON, and APIs."],
  ["PHP", "Study PHP for 40 hours as stated in the public course post."],
  ["Database Normalization, Relationships & ERD", "Model databases with normalization, relationships, and ERD diagrams."],
  ["Program Flow & Logic", "Develop program-flow and logical problem-solving skills."],
  ["Individual Final Project", "Complete an individual final project for certificate eligibility."],
];

function placeholders(rowCount, columnCount) {
  return Array.from({ length: rowCount }, () => "(" + Array.from({ length: columnCount }, () => "?").join(", ") + ")").join(", ");
}

async function replaceCatalog() {
  await ensureSchema();

  // Preserve students, teachers, reviews, notifications, and contacts. Replace only
  // the course catalog and its direct curriculum/session relationships.
  await execute("UPDATE students SET course_id = NULL, session_id = NULL WHERE course_id IS NOT NULL OR session_id IS NOT NULL");
  for (const statement of [
    "DELETE FROM course_teachers",
    "DELETE FROM subjects",
    "DELETE FROM sessions",
    "DELETE FROM courses",
  ]) {
    await execute(statement);
  }

  const courseColumns = "title, description, price, image, subject, level, duration, created_at, updated_at";
  const courseArgs = courses.flatMap((course) => [
    course.title,
    course.description,
    course.price,
    null,
    course.subject,
    course.level,
    course.duration,
    now,
    now,
  ]);
  await execute(
    `INSERT INTO courses (${courseColumns}) VALUES ${placeholders(courses.length, 9)}`,
    courseArgs
  );

  const courseRows = await query("SELECT id, title FROM courses ORDER BY id");
  const webCourse = courseRows.find((course) => course.title === "Web Design & Development (FullStack Class)");
  if (!webCourse) throw new Error("The Web Design & Development course was not created.");

  const subjectArgs = webSubjects.flatMap(([name, description]) => [Number(webCourse.id), name, description, now]);
  await execute(
    `INSERT INTO subjects (course_id, name, description, created_at) VALUES ${placeholders(webSubjects.length, 4)}`,
    subjectArgs
  );

  await execute(
    "INSERT INTO sessions (course_id, name, start_time, end_time, created_at) VALUES (?, ?, ?, ?, ?)",
    [Number(webCourse.id), "September 2026 FullStack Class", "2026-09-07 13:00", "2026-09-07 15:00", now]
  );

  const [courseCount] = await query("SELECT COUNT(*) AS count FROM courses");
  const [subjectCount] = await query("SELECT COUNT(*) AS count FROM subjects");
  const [sessionCount] = await query("SELECT COUNT(*) AS count FROM sessions");
  console.log(JSON.stringify({
    ok: true,
    source_pages: SOURCE_PAGES,
    counts: {
      courses: Number(courseCount.count),
      subjects: Number(subjectCount.count),
      sessions: Number(sessionCount.count),
    },
    courses: courseRows.map((course) => course.title),
  }, null, 2));
}

replaceCatalog().catch((error) => {
  console.error("Catalog replacement failed:", error.message || error);
  process.exitCode = 1;
});
