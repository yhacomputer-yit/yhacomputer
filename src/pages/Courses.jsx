import { useSiteData } from "../data.jsx";
import CourseCard from "../components/CourseCard.jsx";

export default function Courses() {
  const { loading, error, courses } = useSiteData();

  return (
    <section className="section">
      <h2 className="title">
        Our <span>Premium</span> Courses
      </h2>
      <div className="grid">
        {loading && <p className="data-status">Loading…</p>}
        {error && <p className="data-status">Could not load data. {error}</p>}
        {!loading && !error && courses.length === 0 && (
          <p className="data-status">No courses available yet.</p>
        )}
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
