import { Link, useParams } from "react-router-dom";
import { useSiteData } from "../data.jsx";

export default function CourseDetail() {
  const { id } = useParams();
  const { loading, error, courses } = useSiteData();

  if (loading) {
    return (
      <div className="detail-page">
        <p className="data-status">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="detail-page">
        <p className="data-status">Could not load data. {error}</p>
      </div>
    );
  }

  const course = courses.find((c) => String(c.id) === String(id));

  if (!course) {
    return (
      <div className="detail-page">
        <Link to="/courses" className="back-link">
          &larr; Back to courses
        </Link>
        <p className="data-status">Course not found.</p>
      </div>
    );
  }

  const badges = [course.subject, course.level, course.duration].filter(Boolean);
  const highlights = (course.highlights || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  return (
    <div className="detail-page">
      <Link to="/courses" className="back-link">
        &larr; Back to courses
      </Link>
      <article className="detail-card">
        {course.image && (
          <div className="detail-hero">
            <img src={"/" + course.image.replace(/^\/+/, "")} alt={course.title} />
          </div>
        )}
        <div className="detail-body">
          <h1>{course.title}</h1>
          {badges.length > 0 && (
            <div className="detail-badges">
              {badges.map((b, i) => (
                <span key={i} className="detail-badge">
                  {b}
                </span>
              ))}
            </div>
          )}
          {course.price && <div className="detail-price">Fee: {course.price}</div>}
          {course.description && <p className="detail-desc">{course.description}</p>}
          {highlights.length > 0 && (
            <div className="detail-highlights">
              <h3>What you'll learn</h3>
              <ul>
                {highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-actions">
            <Link to="/contact" className="btn-enroll">
              Enroll Now
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
