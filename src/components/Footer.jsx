import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-mark">Y</span>
            <span>
              <strong>YHA Computer</strong>
              <small>Learn. Build. Grow.</small>
            </span>
          </div>
          <p>
            Practical technology education built around useful skills, real
            projects, and supportive learning.
          </p>
        </div>
        <div className="footer-links">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/reviews">Reviews</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <ul>
            <li className="footer-contact-address">
              No.29, 6th Floor, Insein Rd, Yangon 11041, Myanmar
            </li>
            <li>
              <a href="tel:+959882328992">+95 9 882 328992</a>
            </li>
            <li>
              <a href="mailto:yhacomputer@gmail.com">yhacomputer@gmail.com</a>
            </li>
            <li>
              <a
                href="https://maps.app.goo.gl/XV3TSdhK1ogpT7jH7"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Google Maps
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-cta">
          <span className="eyebrow">Start learning</span>
          <h4>Need help choosing a course?</h4>
          <Link to="/contact" className="button button-light">
            Talk to our team
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} YHA Computer. All rights reserved.</p>
      </div>
    </footer>
  );
}
