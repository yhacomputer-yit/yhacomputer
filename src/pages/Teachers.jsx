import { useSiteData } from "../data.jsx";
import { useSeo } from "../seo.js";

function resolveImage(value) {
  if (!value) return "";
  if (/^(https?:|data:)/i.test(value)) return value;
  return "/" + value.replace(/^\/+/, "");
}

export default function Teachers() {
  const { loading, error, teachers, courseTeachers, courses } = useSiteData();
  useSeo({
    title: "Teachers",
    description:
      "Meet the YHA Computer instructors — experienced teachers guiding practical IT courses in Myanmar.",
    url: "/teachers",
  });

  const getTeacherCourses = (teacherId) => {
    const courseIds = courseTeachers
      .filter((ct) => String(ct.teacher_id) === String(teacherId))
      .map((ct) => String(ct.course_id));
    return courses.filter((c) => courseIds.includes(String(c.id)));
  };

  return (
    <>
      <header className="page-hero page-hero-orange">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Expert guidance</p>
            <h1>Learn from experienced instructors.</h1>
          </div>
          <p>
            Every teacher at YHA Computer brings practical industry experience
            and a passion for helping students build real skills.
          </p>
        </div>
      </header>
      <section className="section">
        <div className="container">
          {loading && (
            <div className="data-state">Loading teachers…</div>
          )}
          {error && (
            <div className="data-state data-state-error">
              <strong>We could not load teachers.</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && teachers.length === 0 && (
            <div className="data-state">
              <strong>No teachers listed yet.</strong>
              <span>Teachers added in the admin dashboard will appear here.</span>
            </div>
          )}
          {!loading && !error && teachers.length > 0 && (
            <div className="teachers-grid">
              {teachers.map((teacher) => {
                const image = resolveImage(teacher.image);
                const teacherCourses = getTeacherCourses(teacher.id);
                return (
                  <article key={teacher.id} className="teacher-card">
                    <div className="teacher-media">
                      {image ? (
                        <img src={image} alt={teacher.name} loading="lazy" />
                      ) : (
                        <span className="teacher-image-fallback" aria-hidden="true">
                          {teacher.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="teacher-body">
                      <h3>{teacher.name}</h3>
                      {teacher.specialization && (
                        <p className="teacher-specialization">
                          {teacher.specialization}
                        </p>
                      )}
                      {teacher.bio && (
                        <p className="teacher-bio">{teacher.bio}</p>
                      )}
                      {teacherCourses.length > 0 && (
                        <div className="teacher-courses">
                          <strong>Teaches:</strong>
                          <ul>
                            {teacherCourses.map((c) => (
                              <li key={c.id}>{c.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="teacher-contact">
                        {teacher.email && (
                          <a href={"mailto:" + teacher.email}>Email</a>
                        )}
                        {teacher.phone && (
                          <a href={"tel:" + teacher.phone}>Phone</a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
