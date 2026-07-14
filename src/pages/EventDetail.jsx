import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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

export default function EventDetail() {
  const { id } = useParams();
  const { loading, error, events } = useSiteData();
  const [active, setActive] = useState(0);

  if (loading) {
    return (
      <div className="detail-page container">
        <div className="detail-loading" aria-label="Loading event">
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
          <strong>We could not load this event.</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const event = events.find((item) => String(item.id) === String(id));

  if (!event) {
    return (
      <div className="detail-page container">
        <Link to="/events" className="back-link">
          &larr; Back to events
        </Link>
        <div className="data-state">
          <strong>Event not found.</strong>
          <span>This event is not currently available in Turso.</span>
        </div>
      </div>
    );
  }

  const gallery = parseImages(event.image);
  const tags = [event.category, event.event_type].filter(Boolean);
  const facts = [
    event.date && { label: "Date", value: event.date },
    event.venue && { label: "Venue", value: event.venue },
    event.duration && { label: "Duration", value: event.duration },
  ].filter(Boolean);

  const siteUrl = "https://www.yha-edu.tech";
  const eventUrl = `${siteUrl}/events/${event.id}`;
  const heroImage = gallery.length > 0 ? gallery[0] : "";

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || `${event.title} hosted by YHA Computer.`,
    url: eventUrl,
    ...(heroImage
      ? { image: heroImage.startsWith("http") ? heroImage : `${siteUrl}${heroImage}` }
      : {}),
    ...(event.date ? { startDate: event.date } : {}),
    ...(tags.length ? { eventType: tags.join(", ") } : {}),
    organizer: {
      "@type": "EducationalOrganization",
      name: "YHA Computer",
      sameAs: siteUrl,
    },
    ...(event.venue
      ? {
          location: {
            "@type": "Place",
            name: event.venue,
            address: event.venue,
          },
        }
      : {}),
  };

  return (
    <div className="detail-page container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <Link to="/events" className="back-link">
        &larr; Back to events
      </Link>
      <article className="detail-card event-detail-card">
        {gallery.length > 0 ? (
          <div className="detail-hero event-detail-hero">
            <img
              src={gallery[active] || gallery[0]}
              alt={event.title}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {tags.length > 0 && (
              <div className="detail-hero-overlay">
                {tags.map((tag) => (
                  <span key={tag} className="detail-hero-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="detail-hero event-detail-hero">
            <span className="detail-image-fallback" aria-hidden="true">
              {(event.title || "E").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="detail-body">
          <p className="eyebrow">Event details</p>
          <h1>{event.title}</h1>
          {tags.length > 0 && (
            <div className="detail-badges">
              {tags.map((tag) => (
                <span key={tag} className="detail-badge">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {facts.length > 0 && (
            <div className="detail-stats">
              {facts.map((fact) => (
                <div className="detail-stat" key={fact.label}>
                  <small>{fact.label}</small>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          )}
          {event.description && <p className="detail-desc">{event.description}</p>}
          {gallery.length > 1 && (
            <div className="event-gallery-thumbs event-detail-thumbs">
              {gallery.map((src, i) => (
                <button
                  type="button"
                  key={src + i}
                  className={"event-thumb" + (i === active ? " is-active" : "")}
                  onClick={() => setActive(i)}
                  aria-label={"View image " + (i + 1)}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <div className="detail-actions">
            <Link to="/contact" className="button button-primary">
              Ask about this event <span>&rarr;</span>
            </Link>
            <Link to="/events" className="button button-ghost-dark">
              Browse more events
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
