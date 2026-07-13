import { Link } from "react-router-dom";
import { useSiteData } from "../data.jsx";

function resolveImage(value) {
  if (!value) return "";
  if (/^(https?:|data:)/i.test(value)) return value;
  return "/" + value.replace(/^\/+/, "");
}

function parseImages(value) {
  return String(value || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(resolveImage);
}

function EventItem({ event, index }) {
  const images = parseImages(event.image);

  return (
    <Link to={"/events/" + event.id} className="event-row">
      <div className="event-number">{String(index + 1).padStart(2, "0")}</div>
      <div className="event-content">
        <div className="event-tags">
          {event.category && <span>{event.category}</span>}
          {event.event_type && <span>{event.event_type}</span>}
        </div>
        <h2>{event.title}</h2>
        {event.description && <p>{event.description}</p>}
        {images.length > 0 && (
          <div className="event-gallery">
            <div className="event-gallery-main">
              <img src={images[0]} alt={event.title} loading="lazy" />
            </div>
            {images.length > 1 && (
              <div className="event-gallery-thumbs">
                {images.slice(0, 5).map((src, i) => (
                  <span
                    key={src + i}
                    className={
                      "event-thumb" + (i === 0 ? " is-active" : "")
                    }
                  >
                    <img src={src} alt="" loading="lazy" />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="event-facts">
        {event.date && (
          <div>
            <small>Date</small>
            <strong>{event.date}</strong>
          </div>
        )}
        {event.venue && (
          <div>
            <small>Venue</small>
            <strong>{event.venue}</strong>
          </div>
        )}
        {event.duration && (
          <div>
            <small>Duration</small>
            <strong>{event.duration}</strong>
          </div>
        )}
        {images.length > 0 && (
          <div>
            <small>Photos</small>
            <strong>{images.length}</strong>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Events() {
  const { loading, error, events } = useSiteData();

  return (
    <>
      <header className="page-hero page-hero-orange">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Workshops & community</p>
            <h1>Meet, build, and learn together.</h1>
          </div>
          <p>
            Discover the latest YHA activities, workshops, and learning events
            published from Turso.
          </p>
        </div>
      </header>
      <section className="section">
        <div className="container">
          <div className="event-list">
            {loading && <div className="data-state">Loading events…</div>}
            {error && (
              <div className="data-state data-state-error">
                <strong>We could not load events.</strong>
                <span>{error}</span>
              </div>
            )}
            {!loading && !error && events.length === 0 && (
              <div className="data-state">
                <strong>No upcoming events yet.</strong>
                <span>Events added in Turso will appear here automatically.</span>
              </div>
            )}
            {events.map((event, index) => (
              <EventItem key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
