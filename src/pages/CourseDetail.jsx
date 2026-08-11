import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSiteData } from "../data.jsx";
import { useSeo } from "../seo.js";

function resolveImage(value) {
  if (!value) return "";
  if (/^(https?:|data:)/i.test(value)) return value;
  return "/" + value.replace(/^\/+/, "");
}

export default function CourseDetail() {
  const { id } = useParams();
  const { loading, error, courses, subjects, sessions, teachers, courseTeachers } = useSiteData();
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

  const image = resolveImage(course.image);
  const badges = [course.subject, course.level, course.duration].filter(Boolean);

  const courseSubjects = subjects.filter((s) => String(s.course_id) === String(course.id));
  const courseSessions = sessions.filter((s) => String(s.course_id) === String(course.id));
  const courseTeacherIds = courseTeachers
    .filter((ct) => String(ct.course_id) === String(course.id))
    .map((ct) => String(ct.teacher_id));
  const courseTeachersList = teachers.filter((t) => courseTeacherIds.includes(String(t.id)));

  const siteUrl = "https://www.yha-edu.tech";
  const numericPrice = course.price
    ? parseFloat(course.price.replace(/[^0-9.]/g, ""))
    : null;
  const courseUrl = `${siteUrl}/courses/${course.id}`;

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description || `${course.title} course by YHA Computer.`,
    provider: {
      "@type": "EducationalOrganization",
      name: "YHA Computer",
      sameAs: siteUrl,
    },
    url: courseUrl,
    ...(image ? { image: image.startsWith("http") ? image : `${siteUrl}${image}` } : {}),
    ...(badges.length ? { educationalLevel: badges.join(", ") } : {}),
    ...(numericPrice && !Number.isNaN(numericPrice)
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "MMK",
            price: numericPrice,
            availability: "https://schema.org/InStock",
            url: courseUrl,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Courses", item: `${siteUrl}/courses` },
      { "@type": "ListItem", position: 3, name: course.title, item: courseUrl },
    ],
  };

  useSeo({
    title: course.title,
    description: course.description,
    image: image || undefined,
    url: `/courses/${course.id}`,
  });

  return (
    <div className="detail-page container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Link to="/courses" className="back-link">
        &larr; Back to courses
      </Link>
      <article className="detail-card">
        <div className="detail-hero">
          {image && !imageFailed ? (
            <img src={image} alt={course.title} loading="lazy" width="800" height="500" onError={() => setImageFailed(true)} />
          ) : (
            <span className="detail-image-fallback" aria-hidden="true">
              {(course.title || "Y").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="detail-hero-overlay">
            <span className="detail-hero-tag">YHA Learning Path</span>
            {course.price && <span className="detail-hero-price">{course.price}</span>}
          </div>
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
          {courseSubjects.length > 0 && (
            <div className="detail-badges" style={{ marginTop: 10 }}>
              {courseSubjects.map((subject) => (
                <span key={subject.id} className="detail-badge">
                  {subject.name}
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
          {courseSubjects.length > 0 && (
            <div className="detail-section">
              <h2>Subjects</h2>
              <ul>
                {courseSubjects.map((subject) => (
                  <li key={subject.id}>
                    <span>&#10003;</span>
                    <div>
                      <strong>{subject.name}</strong>
                      {subject.description && <p>{subject.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {courseSessions.length > 0 && (
            <div className="detail-section">
              <h2>Sessions</h2>
              <ul>
                {courseSessions.map((session) => (
                  <li key={session.id}>
                    <span>&#128337;</span>
                    <strong>{session.name}</strong>: {session.start_time} - {session.end_time}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {courseTeachersList.length > 0 && (
            <div className="detail-section">
              <h2>Teachers</h2>
              <ul>
                {courseTeachersList.map((teacher) => (
                  <li key={teacher.id}>
                    <span>&#128100;</span>
                    <strong>{teacher.name}</strong>
                    {teacher.specialization ? ` — ${teacher.specialization}` : ""}
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
