import { useSiteData } from "../data.jsx";

export default function Events() {
  const { loading, error, events } = useSiteData();

  return (
    <section className="section bg-orange">
      <div className="container">
        <div className="section-head">
          <h2 className="title">
            Upcoming <span>Events</span>
          </h2>
          <p>
            Learn, compete, and connect through practical workshops and community
            activities.
          </p>
        </div>
        <div className="event-grid">
          {loading && <p className="data-status">Loading…</p>}
          {error && <p className="data-status">Could not load data. {error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="data-status">No upcoming events yet.</p>
          )}
          {events.map((e) => {
            const footer = [e.venue, e.duration].filter(Boolean).join(" · ");
            return (
              <article key={e.id} className="card event-card">
                {e.category && <div className="event-pill">{e.category}</div>}
                <h3>{e.title}</h3>
                {e.description && <p>{e.description}</p>}
                {e.date && <span className="event-date">{e.date}</span>}
                {footer && <span className="event-meta">{footer}</span>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
