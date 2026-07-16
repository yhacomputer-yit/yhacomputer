import { useState } from "react";
import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = course.image
    ? /^(https?:|data:)/i.test(course.image)
      ? course.image
      : "/" + course.image.replace(/^\/+/, "")
    : "";
  const metadata = [course.subject, course.level].filter(Boolean);

  return (
    <article className="course-card">
      <Link to={"/courses/" + course.id} className="course-card-media">
        {image && !imageFailed ? (
          <img src={image} alt={course.title} loading="lazy" width="400" height="260" onError={() => setImageFailed(true)} />
        ) : (
          <span className="course-image-fallback" aria-hidden="true">
            {(course.title || "Y").charAt(0).toUpperCase()}
          </span>
        )}
        {course.level && <span className="course-level">{course.level}</span>}
      </Link>
      <div className="course-card-body">
        {metadata.length > 0 && (
          <div className="course-kicker">{metadata.join(" · ")}</div>
        )}
        <h3>
          <Link to={"/courses/" + course.id}>{course.title}</Link>
        </h3>
        {course.description && <p>{course.description}</p>}
        <div className="course-card-footer">
          <div>
            {course.duration && <span className="course-duration">{course.duration}</span>}
            {course.price && <strong>{course.price}</strong>}
          </div>
          <Link
            className="circle-link"
            to={"/courses/" + course.id}
            aria-label={"View " + course.title}
          >
            &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
