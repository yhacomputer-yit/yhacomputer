import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ensureSchema, execute, query } from "../api/_db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const now = new Date().toISOString();

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

async function findCourse(title) {
  const rows = await query("SELECT id, title FROM courses WHERE title = ? LIMIT 1", [title]);
  return rows[0] || null;
}

async function insertCourseOnce(course) {
  const existing = await findCourse(course.title);
  if (existing) return { row: existing, created: false };

  await execute(
    `INSERT INTO courses (
      title, description, price, image, subject, level, duration,
      is_published, featured, sort_order, enrollment_open, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      course.title,
      course.description,
      course.price,
      course.image ?? null,
      course.subject,
      course.level ?? null,
      course.duration ?? null,
      1,
      0,
      course.sortOrder,
      1,
      now,
      now,
    ],
  );
  return { row: await findCourse(course.title), created: true };
}

async function insertSubjectOnce(courseId, name, description) {
  const existing = await query(
    "SELECT id FROM subjects WHERE course_id = ? AND name = ? LIMIT 1",
    [courseId, name],
  );
  if (existing.length) return false;
  await execute(
    "INSERT INTO subjects (course_id, name, description, created_at) VALUES (?, ?, ?, ?)",
    [courseId, name, description, now],
  );
  return true;
}

async function insertDemoReviewOnce(name, courseId, message) {
  const existing = await query(
    "SELECT id FROM reviews WHERE name = ? AND message = ? LIMIT 1",
    [name, message],
  );
  if (existing.length) return false;
  await execute(
    "INSERT INTO reviews (name, course_id, message, created_at) VALUES (?, ?, ?, ?)",
    [name, courseId, message, now],
  );
  return true;
}

async function seedDemoCatalogAndReviews() {
  await ensureSchema();

  // This update is backed by the visible public programming-class announcement
  // on the YHA Computer Facebook page, reviewed on 2026-08-16.
  await execute(
    `UPDATE courses
     SET price = ?, duration = ?, level = COALESCE(NULLIF(level, ''), ?), updated_at = ?
     WHERE title = ?`,
    [300000, "3 months", "Beginner", now, "Python Programming Class"],
  );

  const courseSpecs = [
    {
      title: "Computer Basic Course (ICT Class)",
      description: "Build confidence with everyday computer use, essential digital tools, and practical ICT foundations.",
      price: 0,
      subject: "Computer Basics",
      level: "Beginner",
      duration: null,
      sortOrder: 20,
      subjects: [
        ["Computer Fundamentals", "Learn confident everyday use of a computer and operating system."],
        ["Digital Productivity", "Practice common document, spreadsheet, and presentation workflows."],
      ],
    },
    {
      title: "Graphic Design (Photoshop & Illustrator)",
      description: "Explore visual design fundamentals with Photoshop and Illustrator through practical creative exercises.",
      price: 0,
      subject: "Graphic Design",
      level: "Beginner to Advanced",
      duration: null,
      sortOrder: 21,
      subjects: [
        ["Photoshop Foundations", "Create and refine raster graphics for practical visual work."],
        ["Illustrator Foundations", "Build vector artwork, layouts, and reusable design assets."],
      ],
    },
  ];

  const courseIds = {};
  let coursesCreated = 0;
  let subjectsCreated = 0;
  for (const spec of courseSpecs) {
    const result = await insertCourseOnce(spec);
    if (result.created) coursesCreated += 1;
    courseIds[spec.title] = Number(result.row.id);
    for (const [name, description] of spec.subjects) {
      if (await insertSubjectOnce(Number(result.row.id), name, description)) {
        subjectsCreated += 1;
      }
    }
  }

  const webCourse = await findCourse("Web Design & Development (FullStack Class)");
  const pythonCourse = await findCourse("Python Programming Class");
  const demoReviews = [
    {
      name: "Demo learner — catalog test",
      courseId: webCourse ? Number(webCourse.id) : null,
      message: "[Demo review for testing] The course information and subject list are clear and easy to browse in the app.",
    },
    {
      name: "Demo learner — mobile test",
      courseId: pythonCourse ? Number(pythonCourse.id) : null,
      message: "[Demo review for testing] The mobile course catalog, updates, and detail pages are straightforward to use.",
    },
    {
      name: "Demo learner — design test",
      courseId: courseIds["Graphic Design (Photoshop & Illustrator)"] ?? null,
      message: "[Demo review for testing] The sample review confirms that course-linked feedback displays correctly.",
    },
  ];

  let reviewsCreated = 0;
  for (const review of demoReviews) {
    if (await insertDemoReviewOnce(review.name, review.courseId, review.message)) {
      reviewsCreated += 1;
    }
  }

  const [courseCount] = await query("SELECT COUNT(*) AS count FROM courses");
  const [subjectCount] = await query("SELECT COUNT(*) AS count FROM subjects");
  const [reviewCount] = await query("SELECT COUNT(*) AS count FROM reviews");
  console.log(JSON.stringify({
    ok: true,
    source: "YHA public Facebook course announcement plus explicitly labeled demo records authorized for testing",
    created: { courses: coursesCreated, subjects: subjectsCreated, reviews: reviewsCreated },
    counts: {
      courses: Number(courseCount.count),
      subjects: Number(subjectCount.count),
      reviews: Number(reviewCount.count),
    },
  }, null, 2));
}

seedDemoCatalogAndReviews().catch((error) => {
  console.error("Demo catalog seed failed:", error.message || error);
  process.exitCode = 1;
});
