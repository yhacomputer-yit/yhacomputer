import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../seo.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSiteData } from "../data.jsx";

function display(value) {
  return value || "Not provided";
}

function statusLabel(status) {
  return {
    approved: "ENROLLED",
    completed: "COMPLETED",
    rejected: "NOT APPROVED",
    cancelled: "CANCELLED",
    pending: "PENDING",
  }[String(status || "pending").toLowerCase()] || "PENDING";
}

export default function StudentDashboard() {
  const { user, login, logout } = useAuth();
  const { courses } = useSiteData();
  const [learning, setLearning] = useState({ enrollments: [], resources: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState({ type: "idle", message: "" });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  useSeo({
    title: "Student Dashboard",
    description: "View your YHA Computer student profile and courses.",
    url: "/student/dashboard",
  });

  useEffect(() => {
    let active = true;
    if (!user?.token) {
      setLoading(false);
      return undefined;
    }
    fetch("/api/student?action=me", {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Unable to load your learning data.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setLearning({ enrollments: data.enrollments || [], resources: data.resources || [] });
        if (data.student) {
          login({ ...data.student, token: user.token });
          setForm(data.student);
        }
      })
      .catch((error) => {
        if (active) setNotice({ type: "error", message: error.message });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user?.token]);

  const courseCount = useMemo(
    () => learning.enrollments.filter((item) => item.status === "approved" || item.status === "completed").length,
    [learning.enrollments]
  );
  const pendingCount = useMemo(
    () => learning.enrollments.filter((item) => item.status === "pending").length,
    [learning.enrollments]
  );

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="form-status form-status-error">Please login to view your dashboard.</p>
          <Link to="/login" className="button button-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const currentForm = form || user;

  const onProfileChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy("profile");
    setNotice({ type: "idle", message: "" });
    try {
      const response = await fetch("/api/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          action: "update_profile",
          name: currentForm.name,
          phone: currentForm.phone,
          father_name: currentForm.father_name,
          mother_name: currentForm.mother_name,
          nrc_number: currentForm.nrc_number,
          viber_phone: currentForm.viber_phone,
          city: currentForm.city,
          township: currentForm.township,
          birthday: currentForm.birthday,
          gender: currentForm.gender,
          education: currentForm.education,
          image: currentForm.image,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update your profile.");
      login({ ...data.student, token: user.token });
      setForm(data.student);
      setEditing(false);
      setNotice({ type: "success", message: "Your profile was updated." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setBusy("");
    }
  };

  const cancelEnrollment = async (enrollmentId) => {
    setBusy(`cancel-${enrollmentId}`);
    setNotice({ type: "idle", message: "" });
    try {
      const response = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ action: "cancel_enrollment", enrollment_id: enrollmentId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to cancel the request.");
      setLearning({ enrollments: data.enrollments || [], resources: data.resources || [] });
      setNotice({ type: "success", message: "Enrollment request cancelled." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setBusy("");
    }
  };

  const resourcesByCourse = useMemo(() => {
    const grouped = new Map();
    learning.resources.forEach((resource) => {
      const key = String(resource.course_id);
      if (!grouped.has(key)) grouped.set(key, { title: resource.course_title || "Course resources", items: [] });
      grouped.get(key).items.push(resource);
    });
    return [...grouped.values()];
  }, [learning.resources]);

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <span className="eyebrow">Student portal</span>
            <h1>My Learning</h1>
            <p>Welcome, {display(user.name)}. Track your course requests and learner profile.</p>
          </div>
          <button className="button button-ghost-dark" onClick={logout}>Logout</button>
        </div>

        {notice.type !== "idle" && <p className={`form-status form-status-${notice.type}`} role="status">{notice.message}</p>}

        <div className="dashboard-metrics">
          <div><strong>{courseCount}</strong><span>Active courses</span></div>
          <div><strong>{pendingCount}</strong><span>Awaiting review</span></div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-heading">
              <div>
                <h3>Complete Profile</h3>
                <p>Keep the same learner information available in the App.</p>
              </div>
              {user.image && <img className="dashboard-profile-image" src={user.image} alt={user.name || "Student profile"} />}
            </div>
            {!editing ? (
              <>
                <div className="dashboard-info">
                  <div><span>Student ID</span><strong>{display(user.student_id)}</strong></div>
                  <div><span>Full Name</span><strong>{display(user.name)}</strong></div>
                  <div><span>Email</span><strong>{display(user.email)}</strong></div>
                  <div><span>Phone</span><strong>{display(user.phone)}</strong></div>
                  <div><span>Father Name</span><strong>{display(user.father_name)}</strong></div>
                  <div><span>Mother Name</span><strong>{display(user.mother_name)}</strong></div>
                  <div><span>NRC Number</span><strong>{display(user.nrc_number)}</strong></div>
                  <div><span>Viber Phone</span><strong>{display(user.viber_phone)}</strong></div>
                  <div><span>City</span><strong>{display(user.city)}</strong></div>
                  <div><span>Township</span><strong>{display(user.township)}</strong></div>
                  <div><span>Birthday</span><strong>{display(user.birthday)}</strong></div>
                  <div><span>Gender</span><strong>{display(user.gender)}</strong></div>
                  <div><span>Education</span><strong>{display(user.education)}</strong></div>
                  <div><span>Register Date</span><strong>{display(user.register_date)}</strong></div>
                  <div><span>Enroll Date</span><strong>{display(user.enroll_date)}</strong></div>
                  <div><span>Status</span><strong>{display(user.status)}</strong></div>
                </div>
                <button className="button button-ghost-dark" onClick={() => { setForm(user); setEditing(true); }}>Edit profile</button>
              </>
            ) : (
              <form className="dashboard-edit-form" onSubmit={saveProfile}>
                {[
                  ["name", "Full Name", "text"],
                  ["phone", "Phone", "text"],
                  ["father_name", "Father Name", "text"],
                  ["mother_name", "Mother Name", "text"],
                  ["nrc_number", "NRC Number", "text"],
                  ["viber_phone", "Viber Phone", "text"],
                  ["city", "City", "text"],
                  ["township", "Township", "text"],
                  ["birthday", "Birthday", "date"],
                  ["education", "Education", "text"],
                  ["image", "Profile Image URL", "url"],
                ].map(([name, label, type]) => (
                  <label key={name}>{label}<input type={type} name={name} value={currentForm[name] || ""} onChange={onProfileChange} required={name === "name" || name === "phone"} /></label>
                ))}
                <label>Gender<select name="gender" value={currentForm.gender || ""} onChange={onProfileChange}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label>
                <div className="dashboard-actions"><button type="submit" className="button button-primary" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile"}</button><button type="button" className="button button-ghost-dark" onClick={() => setEditing(false)}>Cancel</button></div>
              </form>
            )}
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-heading"><div><h3>My Learning</h3><p>Course requests and approved classes.</p></div><Link to="/courses" className="button button-ghost-dark">Browse courses</Link></div>
            {loading ? <p>Loading your learning data…</p> : learning.enrollments.length === 0 ? <p>No course requests yet. Browse courses to get started.</p> : (
              <div className="dashboard-enrollments">
                {learning.enrollments.map((enrollment) => (
                  <article className="dashboard-enrollment" key={enrollment.id}>
                    <div><h4>{enrollment.course_title}</h4><span className={`dashboard-status dashboard-status-${enrollment.status}`}>{statusLabel(enrollment.status)}</span></div>
                    {enrollment.session_name && <p>{enrollment.session_name}{enrollment.session_start_time ? ` · ${enrollment.session_start_time}–${enrollment.session_end_time}` : ""}</p>}
                    <p>{enrollment.course_duration || ""}{enrollment.course_price ? ` · ${enrollment.course_price}` : ""}</p>
                    <p className={`dashboard-payment dashboard-payment-${enrollment.payment_status || "unpaid"}`}>Payment: {(enrollment.payment_status || "unpaid").toUpperCase()}{enrollment.payment_due ? ` · Due ${enrollment.payment_due}` : ""}{enrollment.payment_paid ? ` · Paid ${enrollment.payment_paid}` : ""}</p>
                    {(enrollment.payment_method || enrollment.payment_reference) && <small>{enrollment.payment_method || ""}{enrollment.payment_reference ? ` · ${enrollment.payment_reference}` : ""}</small>}
                    {(enrollment.admin_note || enrollment.student_note) && <small>{enrollment.admin_note || enrollment.student_note}</small>}
                    {enrollment.status === "pending" && <button className="button button-ghost-dark" disabled={busy === `cancel-${enrollment.id}`} onClick={() => cancelEnrollment(enrollment.id)}>{busy === `cancel-${enrollment.id}` ? "Cancelling…" : "Cancel request"}</button>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="dashboard-card dashboard-resources-card">
          <div className="dashboard-card-heading">
            <div><h3>Course Resources</h3><p>Files, PDFs, ZIP archives, YouTube videos, and notes for your approved courses.</p></div>
          </div>
          {loading ? <p>Loading course resources…</p> : resourcesByCourse.length === 0 ? <p>Resources will appear here after an admin approves your course enrollment.</p> : (
            <div className="dashboard-resource-groups">
              {resourcesByCourse.map((group) => (
                <div className="dashboard-resource-group" key={group.title}>
                  <h4>{group.title}</h4>
                  <div className="dashboard-resource-list">
                    {group.items.map((resource) => (
                      <article className="dashboard-resource" key={resource.id}>
                        <div className="dashboard-resource-icon" aria-hidden="true">{resource.resource_type === "youtube" ? "▶" : resource.resource_type === "note" ? "✎" : "↓"}</div>
                        <div className="dashboard-resource-body"><strong>{resource.title}</strong>{resource.note && <p>{resource.note}</p>}<span>{String(resource.resource_type || "file").toUpperCase()}</span></div>
                        {resource.url && <a className="button button-ghost-dark" href={resource.url} target="_blank" rel="noreferrer">{resource.resource_type === "youtube" ? "Watch" : resource.resource_type === "note" ? "Open" : "Download"}</a>}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
