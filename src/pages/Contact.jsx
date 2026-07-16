import { useState } from "react";
import { useSeo } from "../seo.js";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useSeo({
    title: "Contact",
    description:
      "Get in touch with the YHA Computer team in Myanmar. Ask about course levels, schedules, enrollment, or which learning path best matches your goals.",
    url: "/contact",
  });

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Sending your message…" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not send your message.");
      }
      setForm({ name: "", email: "", message: "" });
      setStatus({
        type: "success",
        message: "Message received. Our team will get back to you soon.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "YHA Computer",
            image: "https://www.yha-edu.tech/images/logo.png",
            url: "https://www.yha-edu.tech/",
            email: "yhacomputer@gmail.com",
            telephone: "+95 9 882 328992",
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              streetAddress: "No.29, 6th Floor, Insein Rd",
              addressLocality: "Yangon",
              postalCode: "11041",
              addressCountry: "MM",
            },
            hasMap: "https://maps.app.goo.gl/XV3TSdhK1ogpT7jH7",
            areaServed: "Myanmar",
            sameAs: [],
          }),
        }}
      />
      <header className="page-hero page-hero-contact">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Course guidance</p>
            <h1>Let&apos;s find the right next step.</h1>
          </div>
          <p>
            Send your question directly to the YHA team. Your message is stored in
            Turso and available to authorized administrators.
          </p>
        </div>
      </header>
      <section className="section">
        <div className="container contact-layout">
          <aside className="contact-aside">
            <p className="eyebrow">How we can help</p>
            <h2>Questions are welcome.</h2>
            <p>
              Ask about course levels, schedules, enrollment, or which learning
              path best matches your goals.
            </p>
            <div className="contact-step">
              <span>01</span>
              <div>
                <strong>Share your goal</strong>
                <p>Tell us what you want to learn or build.</p>
              </div>
            </div>
            <div className="contact-step">
              <span>02</span>
              <div>
                <strong>Get clear guidance</strong>
                <p>Our team reviews your message from the admin dashboard.</p>
              </div>
            </div>
            <div className="contact-details">
              <h3>YHA Computer</h3>
              <p className="contact-details-address">
                No.29, 6th Floor, Insein Rd, Yangon 11041, Myanmar
              </p>
              <ul>
                <li>
                  <span>Phone</span>
                  <a href="tel:+959882328992">+95 9 882 328992</a>
                </li>
                <li>
                  <span>Email</span>
                  <a href="mailto:yhacomputer@gmail.com">yhacomputer@gmail.com</a>
                </li>
                <li>
                  <span>Map</span>
                  <a
                    href="https://maps.app.goo.gl/XV3TSdhK1ogpT7jH7"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </li>
              </ul>
            </div>
          </aside>
          <div className="contact-card">
            <div className="form-heading">
              <span>Message the YHA team</span>
              <h2>How can we help?</h2>
            </div>
            <form className="contact-form" onSubmit={onSubmit}>
              <div className="form-row">
                <label>
                  Name
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
              <label>
                Message
                <textarea
                  rows="6"
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  placeholder="Tell us what you would like to learn."
                  required
                />
              </label>
              <button
                type="submit"
                className="button button-primary"
                disabled={status.type === "loading"}
              >
                {status.type === "loading" ? "Sending…" : "Send message"}
                <span>&rarr;</span>
              </button>
              {status.type !== "idle" && (
                <p className={"form-status form-status-" + status.type} role="status">
                  {status.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
