import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="logo">
            YHA <span>COMPUTER</span>
          </div>
          <p>Trusted IT training for students and professionals across Myanmar.</p>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
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
          <p>Email: info@yhacomputer.com</p>
          <p>Phone: 09-123456789</p>
          <p>No. 12, Main Road, Yangon</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 YHA Computer. All rights reserved.</p>
      </div>
    </footer>
  );
}
