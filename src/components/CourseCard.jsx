import { useState } from "react";
import { Link } from "react-router-dom";

function formatFee(value) {
  const numeric = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return "Fee to be confirmed";
  return "MMK " + new Intl.NumberFormat("en-US").format(numeric);
}

export default function CourseCard({ course, subjects = [] }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = course.image
    ? /^(https?:|data:)/i.test(course.image)
      ? course.image
      : "/" + course.image.replace(/^\/+/, "")
    : "";
  const category = course.subject ? [course.subject] : [];
  const hasFee = Number(String(course.price ?? "").replace(/[^0-9.]/g, "")) > 0;
  const hasSubjects = subjects.length > 0;

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
        {category.length > 0 && <div className="course-kicker">{category.join(" · ")}</div>}
        <h3>
          <Link to={"/courses/" + course.id}>{course.title}</Link>
        </h3>
        <p className={course.description ? "" : "course-card-placeholder"}>
          {course.description || "Course details will be announced soon."}
        </p>
        <div className="course-card-detail-row">
          <span>{course.duration || "Schedule to be announced"}</span>
          <span>{hasSubjects ? subjects.length + " subjects" : "Curriculum pending"}</span>
        </div>
        <div className="course-card-footer">
          <strong className={hasFee ? "" : "course-fee-pending"}>{formatFee(course.price)}</strong>
          <Link className="circle-link" to={"/courses/" + course.id} aria-label={"View " + course.title}>
            &rarr;
          </Link>
        </div>
      </div>
    </article>
  );
}
