import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

for (const fileName of [".env", ".env.local"]) {
  const envPath = path.join(projectRoot, fileName);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const { query } = await import("../api/_db.js");
const dataHandler = (await import("../api/data.js")).default;

const counts = await query(`
  SELECT 'courses' AS table_name, COUNT(*) AS count FROM courses
  UNION ALL SELECT 'subjects', COUNT(*) FROM subjects
  UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
  UNION ALL SELECT 'teachers', COUNT(*) FROM teachers
  UNION ALL SELECT 'course_teachers', COUNT(*) FROM course_teachers
  UNION ALL SELECT 'events', COUNT(*) FROM events
  UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
  UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
  UNION ALL SELECT 'students', COUNT(*) FROM students
`);

const response = await new Promise((resolve, reject) => {
  const res = {
    statusCode: 200,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      resolve({ status: this.statusCode, body });
    },
  };
  Promise.resolve(dataHandler({ method: "GET" }, res)).catch(reject);
});

if (response.status !== 200) {
  throw new Error("Public data handler returned HTTP " + response.status + ": " + JSON.stringify(response.body));
}

console.log(JSON.stringify({
  ok: true,
  counts,
  api: {
    courses: response.body.courses.length,
    subjects: response.body.subjects.length,
    sessions: response.body.sessions.length,
    teachers: response.body.teachers.length,
    events: response.body.events.length,
    reviews: response.body.reviews.length,
    notifications: response.body.notifications.length,
  },
}, null, 2));
