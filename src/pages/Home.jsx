import { Link } from "react-router-dom";
import { useSiteData } from "../data.jsx";
import CourseCard from "../components/CourseCard.jsx";

export default function Home() {
  const { loading, error, courses } = useSiteData();
  const featured = courses.slice(0, 3);

  return (
    <>
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">Orange + White IT Training</p>
          <h1>
            အနာဂတ်နည်းပညာကို
            <br />
            <span>YHA နဲ့အတူ စတင်လိုက်ပါ</span>
          </h1>
          <p className="hero-copy">
            Practical courses, real projects, and strong support for the next
            generation of tech talent.
          </p>
          <Link to="/courses" className="btn-primary">
            Explore Courses
          </Link>
        </div>
      </header>

      <section className="section">
        <h2 className="title">
          Our <span>Premium</span> Courses
        </h2>
        <div className="grid">
          {loading && <p className="data-status">Loading…</p>}
          {error && <p className="data-status">Could not load data. {error}</p>}
          {!loading && !error && featured.length === 0 && (
            <p className="data-status">No courses available yet.</p>
          )}
          {featured.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
        {!loading && !error && courses.length > 3 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link to="/courses" className="btn-enroll" style={{ width: "auto", padding: "14px 40px" }}>
              View all courses
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
