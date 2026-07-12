import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSiteData } from "../data.jsx";

export default function CourseDetail() {
  const { id } = useParams();
  const { loading, error, courses } = useSiteData();
  const [imageFailed, setImageFailed] = useState(false);

  if (loading) {
    return (
      <div className="detail-page container">
        <div className="detail-loading" aria-label="Loading course">
          <span />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page container">
        <div className="data-state data-state-error">
          <strong>We could not load this course.</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const course = courses.find((item) => String(item.id) === String(id));

  if (!course) {
    return (
      <div className="detail-page container">
        <Link to="/courses" className="back-link">
          &larr; Back to courses
        </Link>
        <div className="data-state">
          <strong>Course not found.</strong>
          <span>This course is not currently available in Turso.</span>
        </div>
      </div>
    );
  }

  const badges = [course.subject, course.level, course.duration].filter(Boolean);
  const highlights = (course.highlights || "")
    .split(",")
    .map((highlight) => highlight.trim())
    .filter(Boolean);
  const image = course.image
    ? /^https?:\/\//i.test(course.image)
      ? course.image
      : "/" + course.image.replace(/^\/+/, "")
    : "";

  return (
    <div className="detail-page container">
      <Link to="/courses" className="back-link">
        &larr; Back to courses
      </Link>
      <article className="detail-card">
        <div className="detail-hero">
          {image && !imageFailed ? (
            <img src={image} alt={course.title} onError={() => setImageFailed(true)} />
          ) : (
            <span className="detail-image-fallback" aria-hidden="true">
              {(course.title || "Y").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="detail-hero-label">YHA Learning Path</div>
        </div>
        <div className="detail-body">
          <p className="eyebrow">Course overview</p>
          <h1>{course.title}</h1>
          {badges.length > 0 && (
            <div className="detail-badges">
              {badges.map((badge) => (
                <span key={badge} className="detail-badge">
                  {badge}
                </span>
              ))}
            </div>
          )}
          {course.price && (
            <div className="detail-price">
              <small>Course fee</small>
              <strong>{course.price}</strong>
            </div>
          )}
          {course.description && <p className="detail-desc">{course.description}</p>}
          {highlights.length > 0 && (
            <div className="detail-highlights">
              <h2>What you&apos;ll learn</h2>
              <ul>
                {highlights.map((highlight) => (
                  <li key={highlight}>
                    <span>&#10003;</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-actions">
            <Link to="/contact" className="button button-primary">
              Ask about enrollment <span>&rarr;</span>
            </Link>
            <Link to="/courses" className="button button-ghost-dark">
              Browse more courses
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
