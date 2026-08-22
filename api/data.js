import { applyCors, handleCorsPreflight } from "./_cors.js";
import { query } from "./_db.js";

const CACHE_TTL_MS = 60 * 1000;
const MAX_LIMIT = 100;
const cache = new Map();

function valueAsString(value) {
  return value == null ? "" : String(value).trim();
}

function parsePositiveInteger(value, fallback, maximum = MAX_LIMIT) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function parseOffset(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function isEnabled(value, fallback = true) {
  if (value == null || value === "") return fallback;
  return value === true || value === 1 || value === "1" || value === "true";
}

function dateMilliseconds(value, fallback = 0) {
  const parsed = Date.parse(valueAsString(value));
  return Number.isNaN(parsed) ? fallback : parsed;
}

function paginate(rows, params) {
  const limit = parsePositiveInteger(params.limit, 25);
  const offset = parseOffset(params.offset);
  return {
    data: rows.slice(offset, offset + limit),
    meta: {
      total: rows.length,
      limit,
      offset,
      has_more: offset + limit < rows.length,
    },
  };
}

function filterCourses(courses, params) {
  const subject = valueAsString(params.subject).toLowerCase();
  const level = valueAsString(params.level).toLowerCase();
  const search = valueAsString(params.q).toLowerCase();
  const courseId = parsePositiveInteger(params.id, null, Number.MAX_SAFE_INTEGER);

  const filtered = courses.filter((course) => {
    // Existing Turso rows have no is_published column until the first admin
    // migration. Those rows remain public by default for backwards compatibility.
    if (!isEnabled(course.is_published, true)) return false;
    if (courseId != null && String(course.id) !== String(courseId)) return false;
    if (subject && valueAsString(course.subject).toLowerCase() !== subject) return false;
    if (level && valueAsString(course.level).toLowerCase() !== level) return false;
    if (!search) return true;

    const searchable = [
      course.title,
      course.description,
      course.subject,
      course.level,
      course.duration,
    ].map(valueAsString).join(" ").toLowerCase();
    return searchable.includes(search);
  });

  return filtered.sort((left, right) => {
    const featuredDifference = Number(isEnabled(right.featured, false)) - Number(isEnabled(left.featured, false));
    if (featuredDifference) return featuredDifference;
    const sortDifference = Number(left.sort_order || 0) - Number(right.sort_order || 0);
    if (sortDifference) return sortDifference;
    return Number(left.id || 0) - Number(right.id || 0);
  });
}

function filterNotifications(notifications, params) {
  const now = Date.now();
  const courseId = parsePositiveInteger(params.course_id, null, Number.MAX_SAFE_INTEGER);
  const sinceId = parsePositiveInteger(params.since_id, null, Number.MAX_SAFE_INTEGER);
  const search = valueAsString(params.q).toLowerCase();
  const allowedPriorities = new Set(["normal", "high", "urgent"]);
  const priority = valueAsString(params.priority).toLowerCase();
  const priorityWeight = { urgent: 3, high: 2, normal: 1 };

  return notifications
    .filter((notification) => {
      const publishAt = dateMilliseconds(notification.publish_at, dateMilliseconds(notification.created_at, 0));
      const expiresAt = dateMilliseconds(notification.expires_at, Number.POSITIVE_INFINITY);
      if (publishAt > now || expiresAt <= now) return false;
      if (courseId != null && String(notification.course_id) !== String(courseId)) return false;
      if (sinceId != null && Number(notification.id || 0) <= sinceId) return false;
      const notificationPriority = valueAsString(notification.priority).toLowerCase() || "normal";
      if (priority && priority !== notificationPriority) return false;
      if (!allowedPriorities.has(notificationPriority)) notification.priority = "normal";
      if (!search) return true;
      return [notification.title, notification.message]
        .map(valueAsString)
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .map((notification) => ({
      ...notification,
      priority: allowedPriorities.has(valueAsString(notification.priority).toLowerCase())
        ? valueAsString(notification.priority).toLowerCase()
        : "normal",
      // Read state is device-local in web and Flutter. This legacy field remains
      // in the payload solely for old clients and is never used to target users.
      is_read: 0,
    }))
    .sort((left, right) => {
      const priorityDifference = priorityWeight[right.priority] - priorityWeight[left.priority];
      if (priorityDifference) return priorityDifference;
      const dateDifference = dateMilliseconds(right.publish_at, dateMilliseconds(right.created_at, 0)) -
        dateMilliseconds(left.publish_at, dateMilliseconds(left.created_at, 0));
      if (dateDifference) return dateDifference;
      return Number(right.id || 0) - Number(left.id || 0);
    });
}

async function optionalQuery(sql, label) {
  try {
    return await query(sql);
  } catch (error) {
    console.error(`[public-data] ${label} query failed:`, error?.message || error);
    return [];
  }
}

async function fetchPublicData() {
  // Schema creation and migrations are performed by authenticated admin writes
  // or scripts/seed-db.js. A public GET remains read-only and fast.
  const [courses, subjects, sessions, teachers, courseTeachers, events, reviews, notifications] = await Promise.all([
    query("SELECT * FROM courses ORDER BY id"),
    optionalQuery("SELECT * FROM subjects ORDER BY id", "subjects"),
    optionalQuery("SELECT * FROM sessions ORDER BY id", "sessions"),
    optionalQuery("SELECT * FROM teachers ORDER BY id", "teachers"),
    optionalQuery("SELECT * FROM course_teachers ORDER BY id", "course_teachers"),
    optionalQuery("SELECT * FROM events ORDER BY COALESCE(date, created_at) DESC, id DESC", "events"),
    optionalQuery("SELECT id, name, course_id, message, created_at FROM reviews ORDER BY id DESC", "reviews"),
    optionalQuery("SELECT id, title, message, course_id, priority, action_url, publish_at, expires_at, is_read, created_at FROM notifications WHERE student_id IS NULL ORDER BY id DESC", "notifications"),
  ]);

  return { courses, subjects, sessions, teachers, courseTeachers, events, reviews, notifications };
}

function collectionResponse(allData, collection, params) {
  if (collection === "courses") {
    return paginate(filterCourses(allData.courses, params), params);
  }

  if (collection === "course") {
    const course = filterCourses(allData.courses, params)[0] || null;
    if (!course) return { data: null, meta: { found: false } };
    const courseId = String(course.id);
    return {
      data: course,
      related: {
        subjects: allData.subjects.filter((subject) => String(subject.course_id) === courseId),
        sessions: allData.sessions.filter((session) => String(session.course_id) === courseId),
        teachers: allData.courseTeachers
          .filter((relation) => String(relation.course_id) === courseId)
          .map((relation) => allData.teachers.find((teacher) => String(teacher.id) === String(relation.teacher_id)))
          .filter(Boolean),
      },
      meta: { found: true },
    };
  }

  if (collection === "notifications") {
    return paginate(filterNotifications(allData.notifications, params), params);
  }

  return null;
}

export const __testables = {
  filterCourses,
  filterNotifications,
  paginate,
};

function cacheControlFor(collection) {
  // Notification sync must see newly published or expired records immediately.
  if (collection === "notifications") return "no-store";
  return "public, max-age=0, s-maxage=60, stale-while-revalidate=60";
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

  const params = req.query || {};
  const requestedCollection = valueAsString(params.collection).toLowerCase();
  const allowedCollections = new Set(["", "courses", "course", "notifications"]);
  if (!allowedCollections.has(requestedCollection)) {
    res.status(400).json({ error: "Unsupported collection. Use courses, course, or notifications." });
    return;
  }
  if (requestedCollection === "course" && !parsePositiveInteger(params.id, null, Number.MAX_SAFE_INTEGER)) {
    res.status(400).json({ error: "A positive course id is required." });
    return;
  }

  const cacheKey = requestedCollection || "all";
  const now = Date.now();
  const cached = cache.get(cacheKey);
  const canUseCache = requestedCollection !== "notifications" &&
    cached?.value && now - cached.at < CACHE_TTL_MS;

  try {
    const allData = canUseCache ? cached.value : await fetchPublicData();
    if (!canUseCache && requestedCollection !== "notifications") {
      cache.set(cacheKey, { at: now, value: allData });
    }

    const result = requestedCollection
      ? collectionResponse(allData, requestedCollection, params)
      : {
          ...allData,
          courses: filterCourses(allData.courses, {}),
          notifications: filterNotifications(allData.notifications, {}),
        };

    res.setHeader("Cache-Control", cacheControlFor(requestedCollection));
    res.status(200).json(result);
  } catch (error) {
    console.error("[public-data] live fetch failed:", error?.message || error);
    if (cached?.value) {
      const result = requestedCollection
        ? collectionResponse(cached.value, requestedCollection, params)
        : {
            ...cached.value,
            courses: filterCourses(cached.value.courses, {}),
            notifications: filterNotifications(cached.value.notifications, {}),
          };
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
      res.status(200).json(result);
      return;
    }
    res.status(503).json({ error: "Unable to load live course data from Turso." });
  }
}
