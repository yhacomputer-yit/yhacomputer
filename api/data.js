import { ensureSchema, query } from "./_db.js";

const CACHE_TTL_MS = 60 * 1000;
let cache = { at: 0, value: null };

const FALLBACK_DATA = {
  courses: [
    {
      id: 1,
      title: "Web Design & Development",
      description: "Build responsive websites with HTML, CSS, JavaScript, and real project workflows.",
      price: 180000,
      image: "/images/one.jpg",
      subject: "Programming",
      level: "Beginner to Intermediate",
      duration: "12 weeks",
      highlights: JSON.stringify(["HTML, CSS & responsive layout", "JavaScript fundamentals", "Portfolio website project"]),
    },
    {
      id: 2,
      title: "Python Programming",
      description: "Learn Python through practical automation, data handling, and clean coding exercises.",
      price: 160000,
      image: "/images/python.jpg",
      subject: "Programming",
      level: "Beginner",
      duration: "10 weeks",
      highlights: JSON.stringify(["Python syntax and functions", "Files, APIs and automation", "Capstone command-line project"]),
    },
    {
      id: 3,
      title: "Flutter & Dart Mobile Development",
      description: "Design and build cross-platform mobile experiences with Flutter and Dart.",
      price: 220000,
      image: "/images/flutter.jpg",
      subject: "Programming",
      level: "Intermediate",
      duration: "14 weeks",
      highlights: JSON.stringify(["Dart language essentials", "Flutter UI and navigation", "Mobile app prototype"]),
    },
    {
      id: 4,
      title: "Graphic Design Master Class",
      description: "Develop visual design confidence with composition, branding, Photoshop, and Illustrator.",
      price: 150000,
      image: "/images/three.jpg",
      subject: "Graphic Design",
      level: "Beginner to Advanced",
      duration: "10 weeks",
      highlights: JSON.stringify(["Design principles and composition", "Photoshop and Illustrator workflow", "Brand identity mini project"]),
    },
  ],
  subjects: [
    { id: 1, course_id: 1, name: "HTML & CSS", description: "Responsive page structure and styling foundations." },
    { id: 2, course_id: 1, name: "JavaScript", description: "Interactive interfaces and browser fundamentals." },
    { id: 3, course_id: 2, name: "Python Core", description: "Readable code, functions, collections, and automation." },
    { id: 4, course_id: 3, name: "Dart", description: "Types, widgets, state, and asynchronous programming." },
    { id: 5, course_id: 4, name: "Visual Design", description: "Color, type, layout, and brand communication." },
  ],
  sessions: [
    { id: 1, course_id: 1, name: "Weekend Web Cohort", start_time: "Saturday 09:00", end_time: "Saturday 11:00" },
    { id: 2, course_id: 2, name: "Evening Python Cohort", start_time: "Tuesday 18:30", end_time: "Tuesday 20:30" },
    { id: 3, course_id: 3, name: "Sunday Mobile Lab", start_time: "Sunday 13:00", end_time: "Sunday 15:30" },
    { id: 4, course_id: 4, name: "Friday Design Studio", start_time: "Friday 18:00", end_time: "Friday 20:00" },
  ],
  teachers: [
    { id: 1, name: "Aung Kyaw", email: "aung.kyaw@yha-edu.tech", phone: "+95 9 700 000 101", specialization: "Web Development", image: "/images/one.jpg", bio: "Project-focused web developer and mentor." },
    { id: 2, name: "May Thiri", email: "may.thiri@yha-edu.tech", phone: "+95 9 700 000 102", specialization: "Python & Automation", image: "/images/two.jpg", bio: "Python instructor focused on practical problem solving." },
    { id: 3, name: "Ko Htet", email: "ko.htet@yha-edu.tech", phone: "+95 9 700 000 103", specialization: "Mobile Development", image: "/images/flutter.jpg", bio: "Mobile developer who turns ideas into usable prototypes." },
  ],
  courseTeachers: [
    { id: 1, course_id: 1, teacher_id: 1 },
    { id: 2, course_id: 2, teacher_id: 2 },
    { id: 3, course_id: 3, teacher_id: 3 },
    { id: 4, course_id: 4, teacher_id: 1 },
  ],
  events: [
    {
      id: 1,
      title: "Open Lab: Build Your First Website",
      description: "A guided Saturday lab for beginners who want to publish a responsive landing page.",
      date: "2026-09-05",
      venue: "YHA Computer Campus",
      category: "Workshop",
      event_type: "Open Lab",
      duration: "2 hours",
      image: "/images/one.jpg",
    },
    {
      id: 2,
      title: "Python Career Q&A",
      description: "Meet instructors and ask practical questions about learning Python for work.",
      date: "2026-09-19",
      venue: "Online + Yangon",
      category: "Talk",
      event_type: "Career Session",
      duration: "90 minutes",
      image: "/images/python.jpg",
    },
    {
      id: 3,
      title: "Student Design Showcase",
      description: "See how learners turn briefs into posters, identities, and digital artwork.",
      date: "2026-10-03",
      venue: "YHA Computer Campus",
      category: "Showcase",
      event_type: "Community Event",
      duration: "3 hours",
      image: "/images/three.jpg",
    },
  ],
  reviews: [
    { id: 1, name: "Su Su", course_id: 1, message: "The project work helped me understand how each topic connects to a real website." },
    { id: 2, name: "Min Thant", course_id: 2, message: "The lessons are clear and the instructor explains the why behind each exercise." },
    { id: 3, name: "Ei Ei", course_id: 3, message: "I started with no mobile development experience and finished a working prototype." },
  ],
  notifications: [
    { id: 1, title: "September cohort registration is open", message: "Weekend and evening sessions are now available for new learners.", course_id: 1, is_read: 0 },
    { id: 2, title: "Free Python career Q&A", message: "Reserve a place for the September career session.", course_id: 2, is_read: 0 },
  ],
};

async function fetchPublicData() {
  await ensureSchema();
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

  if (!courses.length) {
    return FALLBACK_DATA;
  }

  return { courses, subjects, sessions, teachers, courseTeachers, events, reviews, notifications };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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
    // If Turso connection fails or env vars are missing on deployment, return fallback seed data gracefully
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(FALLBACK_DATA);
  }
}
