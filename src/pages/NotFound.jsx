import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section" style={{ textAlign: "center" }}>
      <h2 className="title">
        Page <span>Not Found</span>
      </h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-enroll" style={{ width: "auto", padding: "14px 40px" }}>
        Back to Home
      </Link>
    </section>
  );
}
