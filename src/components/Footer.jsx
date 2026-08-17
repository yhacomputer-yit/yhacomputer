import { Link } from "react-router-dom";

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/yhaacademytech", icon: "f" },
  { label: "YouTube", href: "https://www.youtube.com/@yhacomputertrainingcenter7644", icon: "▶" },
  { label: "TikTok", href: "https://www.tiktok.com/@yhaacademytech", icon: "♪" },
  { label: "Instagram", href: "https://www.instagram.com/yhacomputer", icon: "◎" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-shell">
        <div className="footer-topline">
          <div className="footer-brand-block">
            <Link to="/" className="footer-logo" aria-label="YHA Computer home">
              <span className="logo-mark">Y</span>
              <span><strong>YHA Computer</strong><small>Learn. Build. Grow.</small></span>
            </Link>
            <p>Practical technology education for learners who want useful skills, real projects, and a confident next step.</p>
            <div className="footer-social" aria-label="Social media links">
              {socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="social-link">{social.icon}</a>)}
            </div>
          </div>
          <div className="footer-column">
            <span className="footer-label">Explore</span>
            <Link to="/">Home</Link><Link to="/courses">Courses</Link><Link to="/events">Events</Link><Link to="/reviews">Reviews</Link>
          </div>
          <div className="footer-column">
            <span className="footer-label">Learner access</span>
            <Link to="/student/dashboard">My Learning</Link><Link to="/login">Student login</Link><Link to="/register">Register</Link><Link to="/contact">Ask a question</Link>
          </div>
          <div className="footer-contact-card">
            <span className="footer-label">Visit YHA</span>
            <p>No.29, 6th Floor, Insein Rd, Yangon 11041, Myanmar</p>
            <a href="tel:+959882328992">+95 9 882 328992</a>
            <a href="mailto:yhacomputer@gmail.com">yhacomputer@gmail.com</a>
            <a href="https://maps.app.goo.gl/XV3TSdhK1ogpT7jH7" target="_blank" rel="noopener noreferrer" className="footer-map-link">Open in Google Maps <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="footer-cta">
          <div><span className="eyebrow">Start your next chapter</span><h2>Ready to build a practical skill?</h2><p>Talk with our team and find the course that fits your goals.</p></div>
          <Link to="/contact" className="button button-light">Talk to our team <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="footer-bottom"><div className="container"><p>© {new Date().getFullYear()} YHA Computer. All rights reserved.</p><div><Link to="/about">About YHA</Link><Link to="/contact">Contact</Link><span>Yangon, Myanmar</span></div></div></div>
    </footer>
  );
}
