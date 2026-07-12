import { useSiteData } from "../data.jsx";

export default function Reviews() {
  const { loading, error, reviews } = useSiteData();

  return (
    <>
      <header className="page-hero page-hero-dark">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Student voices</p>
            <h1>Real feedback from the YHA community.</h1>
          </div>
          <p>
            Every review on this page is loaded from Turso and managed through
            the YHA admin dashboard.
          </p>
        </div>
      </header>
      <section className="section">
        <div className="container">
          <div className="review-grid">
            {loading && <div className="data-state">Loading reviews…</div>}
            {error && (
              <div className="data-state data-state-error">
                <strong>We could not load student reviews.</strong>
                <span>{error}</span>
              </div>
            )}
            {!loading && !error && reviews.length === 0 && (
              <div className="data-state">
                <strong>No reviews yet.</strong>
                <span>Published Turso reviews will appear here.</span>
              </div>
            )}
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <span className="quote-mark">&ldquo;</span>
                <p>{review.message}</p>
                {(review.name || review.course_name) && (
                  <div className="review-author">
                    {review.name && <span>{review.name.charAt(0).toUpperCase()}</span>}
                    <div>
                      {review.name && <strong>{review.name}</strong>}
                      {review.course_name && <small>{review.course_name}</small>}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
