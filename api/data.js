import { applyCors, handleCorsPreflight } from "./_cors.js";
import { query } from "./_db.js";

const CACHE_TTL_MS = 60 * 1000;
let cache = { at: 0, value: null };

async function fetchPublicData() {
  // Schema creation and migrations are performed by scripts/seed-db.js.
  // A public GET must stay read-only and fast enough for Vercel serverless execution.
  const [courses, subjects, sessions, teachers, courseTeachers, events, reviews, notifications] = await Promise.all([
    query("SELECT * FROM courses ORDER BY id"),
    query("SELECT * FROM subjects ORDER BY id"),
    query("SELECT * FROM sessions ORDER BY id"),
    query("SELECT * FROM teachers ORDER BY id"),
    query("SELECT * FROM course_teachers ORDER BY id"),
    query("SELECT * FROM events ORDER BY COALESCE(date, created_at) DESC, id DESC"),
    query("SELECT id, name, course_id, message, created_at FROM reviews ORDER BY id DESC"),
    query("SELECT id, title, message, course_id, is_read, created_at FROM notifications ORDER BY id DESC"),
  ]);

  return { courses, subjects, sessions, teachers, courseTeachers, events, reviews, notifications };
}

export default async function handler(req, res) {
  const methods = ["GET", "OPTIONS"];
  if (handleCorsPreflight(req, res, methods)) return;
  applyCors(req, res, methods);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const now = Date.now();
  if (cache.value && now - cache.at < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).json(cache.value);
    return;
  }

  try {
    const value = await fetchPublicData();
    cache = { at: now, value };
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).json(value);
  } catch (error) {
    // A temporary cached response is safer than an empty/placeholder data set.
    if (cache.value) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
      res.status(200).json(cache.value);
      return;
    }
    res.status(503).json({ error: "Unable to load live course data from Turso." });
  }
}
