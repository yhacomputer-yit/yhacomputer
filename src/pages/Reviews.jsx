import { useState } from "react";
import { useSiteData } from "../data.jsx";
import Pager from "../components/Pager.jsx";

export default function Reviews() {
  const { loading, error, reviews } = useSiteData();
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = reviews.slice(start, start + PAGE_SIZE);

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
          {visible.length > 0 && (
            <div className="review-masonry">
              {visible.map((review) => (
                <article key={review.id} className="review-card">
                  <span className="quote-mark">&ldquo;</span>
                  {review.course_name && (
                    <span className="review-tag">{review.course_name}</span>
                  )}
                  <p>{review.message}</p>
                  <div className="review-author">
                    <span>{review.name ? review.name.charAt(0).toUpperCase() : "?"}</span>
                    <div>
                      {review.name && <strong>{review.name}</strong>}
                      {review.course_name && <small>{review.course_name}</small>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pager page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      </section>
    </>
  );
}
