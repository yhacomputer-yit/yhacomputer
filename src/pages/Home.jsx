import { Link } from "react-router-dom";
import { useSiteData } from "../data.jsx";
import CourseCard from "../components/CourseCard.jsx";

export default function Home() {
  const { loading, error, courses, events, reviews } = useSiteData();
  const featured = courses.slice(0, 3);
  const nextEvents = events.slice(0, 2);

  return (
    <>
      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="eyebrow">Practical IT training in Myanmar</p>
            <h1>
              Build skills that move your
              <span> future forward.</span>
            </h1>
            <p className="hero-copy">
              Learn current technology through guided lessons, real projects,
              and a community that helps you keep growing.
            </p>
            <div className="hero-actions">
              <Link to="/courses" className="button button-primary">
                Explore courses <span>&rarr;</span>
              </Link>
              <Link to="/contact" className="button button-ghost">
                Get course guidance
              </Link>
            </div>
            <div className="hero-metrics" aria-label="Live Turso data totals">
              <div>
                <strong>{loading ? "—" : courses.length}</strong>
                <span>Courses</span>
              </div>
              <div>
                <strong>{loading ? "—" : events.length}</strong>
                <span>Events</span>
              </div>
              <div>
                <strong>{loading ? "—" : reviews.length}</strong>
                <span>Reviews</span>
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-label="Latest learning opportunities">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="learning-panel">
              <div className="panel-heading">
                <span className="live-dot" />
                Live from our course catalog
              </div>
              {loading && (
                <div className="panel-loading">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {!loading && error && (
                <p className="panel-message">Course data is temporarily unavailable.</p>
              )}
              {!loading && !error && featured.length === 0 && (
                <p className="panel-message">New courses will appear here from Turso.</p>
              )}
              {!loading &&
                !error &&
                featured.map((course, index) => (
                  <Link
                    to={"/courses/" + course.id}
                    className="panel-course"
                    key={course.id}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{course.title}</strong>
                      <small>
                        {[course.level, course.duration].filter(Boolean).join(" · ")}
                      </small>
                    </div>
                    <b>&rarr;</b>
                  </Link>
                ))}
            </div>
            <div className="floating-note">
              <strong>Project-first</strong>
              <span>Learn by building</span>
            </div>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Turso-powered course catalog</p>
              <h2>Find your next skill</h2>
            </div>
            <Link to="/courses" className="text-link">
              View all courses &rarr;
            </Link>
          </div>
          <div className="course-grid">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-card" key={index} aria-hidden="true">
                <span />
                <i />
                <i />
              </div>
            ))}
          {error && (
            <div className="data-state data-state-error">
              <strong>We could not load courses.</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && featured.length === 0 && (
            <div className="data-state">
              <strong>No courses available yet.</strong>
              <span>Courses added in the admin dashboard will appear here.</span>
            </div>
          )}
          {featured.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
          </div>
        </div>
      </section>

      <section className="section section-ink">
        <div className="container value-grid">
          <div className="value-intro">
            <p className="eyebrow">A better way to learn</p>
            <h2>More practice. More confidence. More progress.</h2>
            <p>
              Every learning path is designed to turn technical concepts into
              useful, job-ready skills.
            </p>
          </div>
          <div className="value-card">
            <span>01</span>
            <h3>Guided learning</h3>
            <p>Clear steps and instructor support keep learning approachable.</p>
          </div>
          <div className="value-card">
            <span>02</span>
            <h3>Real projects</h3>
            <p>Apply each topic through practical work you can demonstrate.</p>
          </div>
          <div className="value-card">
            <span>03</span>
            <h3>Community support</h3>
            <p>Learn alongside people who share your goals and momentum.</p>
          </div>
        </div>
      </section>

      {(loading || error || nextEvents.length > 0) && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Learn together</p>
                <h2>Upcoming events</h2>
              </div>
              <Link to="/events" className="text-link">
                See all events &rarr;
              </Link>
            </div>
            <div className="home-event-grid">
              {loading && <div className="data-state">Loading events…</div>}
              {error && (
                <div className="data-state data-state-error">
                  Events are temporarily unavailable.
                </div>
              )}
              {!loading &&
                !error &&
                nextEvents.map((event) => (
                  <Link to="/events" className="home-event" key={event.id}>
                    {event.date && <span>{event.date}</span>}
                    <h3>{event.title}</h3>
                    <p>{[event.venue, event.duration].filter(Boolean).join(" · ")}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-cta">
        <div className="container cta-card">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Choose a course with confidence.</h2>
          </div>
          <Link to="/contact" className="button button-light">
            Ask for guidance <span>&rarr;</span>
          </Link>
        </div>
      </section>
    </>
  );
}
