import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSeo } from "../seo.js";
import { useSiteData } from "../data.jsx";

export default function Register() {
  const { courses, sessions } = useSiteData();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    father_name: "",
    mother_name: "",
    nrc_number: "",
    viber_phone: "",
    city: "",
    township: "",
    birthday: "",
    gender: "",
    education: "",
    course_id: "",
    session_id: "",
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const navigate = useNavigate();

  useSeo({
    title: "Student Registration",
    description: "Register for a YHA Computer course.",
    url: "/register",
  });

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const availableSessions = sessions.filter(
    (s) => String(s.course_id) === String(form.course_id)
  );

  const selectedCourse = courses.find((c) => String(c.id) === String(form.course_id));
  const selectedSession = sessions.find((s) => String(s.id) === String(form.session_id));

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Submitting registration…" });
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, action: "register" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }
      setStatus({
        type: "success",
        message: data.message || "Registration successful!",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <span className="eyebrow">Student registration</span>
          <h1>Create your account</h1>
          <p>Join YHA Computer and start your learning journey.</p>
        </div>

        <div className="register-steps">
          <div className={"register-step" + (step >= 1 ? " is-active" : "")}>
            <span>1</span>
            <div>
              <strong>Personal</strong>
              <small>Basic info</small>
            </div>
          </div>
          <div className={"register-step" + (step >= 2 ? " is-active" : "")}>
            <span>2</span>
            <div>
              <strong>Details</strong>
              <small>Address & more</small>
            </div>
          </div>
          <div className={"register-step" + (step >= 3 ? " is-active" : "")}>
            <span>3</span>
            <div>
              <strong>Review</strong>
              <small>Submit</small>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {step === 1 && (
            <div className="register-form-section">
              <div className="register-row">
                <label>
                  Full Name *
                  <input type="text" name="name" value={form.name} onChange={onChange} required placeholder="e.g. John Doe" />
                </label>
                <label>
                  Email *
                  <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
                </label>
              </div>
              <div className="register-row">
                <label>
                  Phone *
                  <input type="text" name="phone" value={form.phone} onChange={onChange} required placeholder="09xxxxxxxxx" />
                </label>
                <label>
                  Father Name
                  <input type="text" name="father_name" value={form.father_name} onChange={onChange} placeholder="Father's name" />
                </label>
              </div>
              <div className="register-row">
                <label>
                  Mother Name
                  <input type="text" name="mother_name" value={form.mother_name} onChange={onChange} placeholder="Mother's name" />
                </label>
                <label>
                  NRC Number
                  <input type="text" name="nrc_number" value={form.nrc_number} onChange={onChange} placeholder="e.g. 12/KaMa(N)123456" />
                </label>
              </div>
              <div className="register-row">
                <label>
                  Viber Phone
                  <input type="text" name="viber_phone" value={form.viber_phone} onChange={onChange} placeholder="Viber number (optional)" />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="register-form-section">
              <div className="register-row">
                <label>
                  City
                  <input type="text" name="city" value={form.city} onChange={onChange} placeholder="e.g. Yangon" />
                </label>
                <label>
                  Township
                  <input type="text" name="township" value={form.township} onChange={onChange} placeholder="e.g. Hlaing" />
                </label>
              </div>
              <div className="register-row">
                <label>
                  Birthday
                  <input type="date" name="birthday" value={form.birthday} onChange={onChange} />
                </label>
                <label>
                  Gender
                  <select name="gender" value={form.gender} onChange={onChange}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>
              <div className="register-row">
                <label>
                  Education
                  <input type="text" name="education" value={form.education} onChange={onChange} placeholder="e.g. BSc Computer Science" />
                </label>
              </div>
              <div className="register-row">
                <label>
                  Course
                  <select name="course_id" value={form.course_id} onChange={onChange} required>
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Session
                  <select name="session_id" value={form.session_id} onChange={onChange} required disabled={!form.course_id}>
                    <option value="">{form.course_id ? "Select a session" : "Select a course first"}</option>
                    {availableSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                        {session.start_time && session.end_time
                          ? ` (${session.start_time} - ${session.end_time})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="register-form-section">
              <div className="register-summary">
                <h3>Review your information</h3>
                <div className="register-summary-grid">
                  <div>
                    <span>Name</span>
                    <strong>{form.name || "—"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{form.email || "—"}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{form.phone || "—"}</strong>
                  </div>
                  <div>
                    <span>Father</span>
                    <strong>{form.father_name || "—"}</strong>
                  </div>
                  <div>
                    <span>Mother</span>
                    <strong>{form.mother_name || "—"}</strong>
                  </div>
                  <div>
                    <span>NRC</span>
                    <strong>{form.nrc_number || "—"}</strong>
                  </div>
                  <div>
                    <span>Viber</span>
                    <strong>{form.viber_phone || "—"}</strong>
                  </div>
                  <div>
                    <span>City</span>
                    <strong>{form.city || "—"}</strong>
                  </div>
                  <div>
                    <span>Township</span>
                    <strong>{form.township || "—"}</strong>
                  </div>
                  <div>
                    <span>Birthday</span>
                    <strong>{form.birthday || "—"}</strong>
                  </div>
                  <div>
                    <span>Gender</span>
                    <strong>{form.gender || "—"}</strong>
                  </div>
                  <div>
                    <span>Education</span>
                    <strong>{form.education || "—"}</strong>
                  </div>
                  <div>
                    <span>Course</span>
                    <strong>{selectedCourse ? selectedCourse.title : (form.course_id || "—")}</strong>
                  </div>
                  <div>
                    <span>Session</span>
                    <strong>{selectedSession ? `${selectedSession.name}${selectedSession.start_time ? ` (${selectedSession.start_time} - ${selectedSession.end_time})` : ""}` : (form.session_id || "—")}</strong>
                  </div>
                </div>
              </div>
              <div className="register-notice">
                <span className="register-notice-icon">&#9888;</span>
                <div>
                  <strong>Account Activation</strong>
                  <p>After registration, your account will be reviewed by the admin. Once approved, the admin will generate your password and you can login with your Student ID and the generated password.</p>
                </div>
              </div>
            </div>
          )}

          <div className="register-actions">
            {step > 1 && (
              <button type="button" className="button button-ghost-dark" onClick={prevStep}>
                &larr; Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="button button-primary" onClick={nextStep}>
                Next <span>&rarr;</span>
              </button>
            ) : (
              <button type="submit" className="button button-primary" disabled={status.type === "loading"}>
                {status.type === "loading" ? "Submitting…" : "Submit Registration"}
                <span>&rarr;</span>
              </button>
            )}
          </div>

          {status.type !== "idle" && (
            <p className={"form-status form-status-" + status.type} role="status">
              {status.message}
            </p>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
