export default function Contact() {
  const onSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <section className="section">
      <div className="container contact-grid">
        <div className="contact-details">
          <h2 className="title" style={{ textAlign: "left" }}>
            Get In <span>Touch</span>
          </h2>
          <p>
            Ready to start your IT journey? Reach out to us for enrollment support,
            course guidance, or a campus visit.
          </p>
          <p className="contact-item">
            <strong>Email:</strong> info@yhacomputer.com
          </p>
          <p className="contact-item">
            <strong>Phone:</strong> 09-123456789
          </p>
        </div>
        <div className="contact-card">
          <h3>Send a Message</h3>
          <form className="contact-form" onSubmit={onSubmit}>
            <label>
              Name
              <input type="text" placeholder="Your name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="Your email" />
            </label>
            <label>
              Message
              <textarea rows="4" placeholder="How can we help you?"></textarea>
            </label>
            <button type="submit" className="btn-primary">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
