import { Link } from "react-router-dom";
import { useSeo } from "../seo.js";

export default function AboutUs() {
  useSeo({
    title: "About Us",
    description:
      "Learn about YHA Computer (YIT) — a Myanmar-based IT training institute helping learners build practical technology skills through real projects and supportive teaching.",
    url: "/about-us",
  });
  return (
    <>
      <header className="page-hero page-hero-orange">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Our story</p>
            <h1>Building skills that move futures forward.</h1>
          </div>
          <p>
            YHA Computer Training was founded to give learners in Myanmar
            practical, job-ready IT education through guided lessons, real
            projects, and a supportive community.
          </p>
        </div>
      </header>
      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="about-card">
              <h2>Mission</h2>
              <p>
                Make practical technology education accessible to everyone who
                wants to build, create, and grow.
              </p>
            </div>
            <div className="about-card">
              <h2>Vision</h2>
              <p>
                A Myanmar workforce confident in modern IT, design, and
                programming skills.
              </p>
            </div>
            <div className="about-card">
              <h2>Values</h2>
              <p>
                Clear instruction, project-first learning, mentor support, and
                community-driven progress.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-ink">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Join us</p>
              <h2>Ready to start learning?</h2>
            </div>
            <Link to="/courses" className="text-link">
              Explore courses &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
