import { useState } from "react";
import { useSiteData } from "../data.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { useSeo } from "../seo.js";

export default function Courses() {
  const { loading, error, courses, subjects, sessions, teachers, courseTeachers } = useSiteData();
  useSeo({
    title: "Courses",
    description:
      "Browse YHA Computer courses in Myanmar — web development, Python, Flutter, Laravel, C#, MERN stack, ICT basics and graphic design. Find the right learning path for you.",
    url: "/courses",
  });

  const categories = ["All", "Programming", "ICT", "Graphic Design"];
  const [active, setActive] = useState("All");

  const normalizedActive = active === "All" ? null : active.toLowerCase().trim();

  const filtered =
    active === "All"
      ? courses
      : courses.filter((course) =>
          String(course.subject || "")
            .toLowerCase()
            .trim() === normalizedActive
        );
  const display = filtered.slice(0, 6);

  return (
    <>
      <header className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Explore the catalog</p>
            <h1>Courses designed for practical progress.</h1>
          </div>
          <p>
            Every course shown here is loaded directly from Turso, so the
            catalog always reflects the latest available learning paths.
          </p>
        </div>
      </header>
      <section className="section">
        <div className="container">
          <div className="catalog-toolbar">
            <div>
              <strong>{loading ? "Loading" : display.length}</strong>
              <span>{display.length === 1 ? "course" : "courses"} available</span>
            </div>
            <span>Choose a course to see the full curriculum</span>
          </div>
          <div className="subject-filter">
            {categories.map((filter) => (
              <button
                key={filter}
                type="button"
                className={
                  "filter-pill" + (active === filter ? " is-active" : "")
                }
                onClick={() => setActive(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="course-grid">
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <div className="skeleton-card" key={index} aria-hidden="true">
                  <span />
                  <i />
                  <i />
                </div>
              ))}
            {error && (
              <div className="data-state data-state-error">
                <strong>We could not load the course catalog.</strong>
                <span>{error}</span>
              </div>
            )}
            {!loading && !error && display.length === 0 && (
              <div className="data-state">
                <strong>No courses available yet.</strong>
                <span>New Turso records will automatically appear here.</span>
              </div>
            )}
            {display.map((course) => (
              <CourseCard key={course.id} course={course} subjects={subjects.filter((s) => String(s.course_id) === String(course.id))} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
