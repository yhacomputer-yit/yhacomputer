import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="not-found-code">404</div>
      <p className="eyebrow">Lost your way?</p>
      <h1>This page does not exist.</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <Link to="/" className="button button-primary">
        Back to home <span>&rarr;</span>
      </Link>
    </section>
  );
}
