import { useSiteData } from "../data.jsx";
import CourseCard from "../components/CourseCard.jsx";

export default function Courses() {
  const { loading, error, courses } = useSiteData();

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
              <strong>{loading ? "Loading" : courses.length}</strong>
              <span>{courses.length === 1 ? "course" : "courses"} available</span>
            </div>
            <span>Choose a course to see the full curriculum</span>
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
            {!loading && !error && courses.length === 0 && (
              <div className="data-state">
                <strong>No courses available yet.</strong>
                <span>New Turso records will automatically appear here.</span>
              </div>
            )}
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
