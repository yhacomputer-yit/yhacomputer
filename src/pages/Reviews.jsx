import { useSiteData } from "../data.jsx";

export default function Reviews() {
  const { loading, error, reviews } = useSiteData();

  return (
    <section className="section">
      <div className="container">
        <h2 className="title">Student Reviews</h2>
        <div className="grid">
          {loading && <p className="data-status">Loading…</p>}
          {error && <p className="data-status">Could not load data. {error}</p>}
          {!loading && !error && reviews.length === 0 && (
            <p className="data-status">No reviews yet.</p>
          )}
          {reviews.map((r) => {
            const attribution = [r.name, r.course_name].filter(Boolean).join(" — ");
            return (
              <div key={r.id} className="card review-card">
                <p>&ldquo;{r.message}&rdquo;</p>
                {attribution && <h4>- {attribution}</h4>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
