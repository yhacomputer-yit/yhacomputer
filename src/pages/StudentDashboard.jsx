import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSeo } from "../seo.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSiteData } from "../data.jsx";

function display(value) {
  return value || "Not provided";
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString();
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

function resourceTypeOf(resource) {
  return String(resource?.resource_type || "file").trim().toLowerCase();
}

function youtubeEmbedUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const id = url.hostname.includes("youtu.be") ? url.pathname.slice(1) : url.searchParams.get("v") || url.pathname.split("/").pop();
    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : "";
  } catch {
    return "";
  }
}

function ResourceViewer({ resource, onClose }) {
  const type = resourceTypeOf(resource);
  const [failed, setFailed] = useState(false);
  const videoUrl = type === "youtube" ? youtubeEmbedUrl(resource.url) : "";
  return <div className="resource-viewer-backdrop" role="dialog" aria-modal="true" aria-label={resource.title}>
    <section className="resource-viewer-card">
      <div className="resource-viewer-header"><div><span className="eyebrow">{type === "youtube" ? "Video lesson" : type === "pdf" ? "PDF preview" : "Resource"}</span><h3>{resource.title}</h3></div><button className="resource-viewer-close" onClick={onClose} aria-label="Close viewer">×</button></div>
      {failed ? <div className="resource-note-preview"><strong>Preview unavailable in this browser.</strong><p>Use “Open separately” below to open the original resource.</p></div> : type === "youtube" && videoUrl ? <div className="resource-video-frame"><iframe src={videoUrl} title={resource.title} onError={() => setFailed(true)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : type === "pdf" && resource.url ? <iframe className="resource-pdf-frame" src={resource.url} title={resource.title} onError={() => setFailed(true)} /> : <div className="resource-note-preview">{resource.note || "This resource does not have an inline preview."}</div>}
      <div className="resource-viewer-footer"><span>{resource.note || "If the preview does not load, open the original resource."}</span>{resource.url && <a className="button button-ghost-dark" href={resource.url} target="_blank" rel="noopener noreferrer">Open separately</a>}</div>
    </section>
  </div>;
}

export default function StudentDashboard() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { courses } = useSiteData();
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };
  const [learning, setLearning] = useState({ enrollments: [], resources: [] });
  const [notifications, setNotifications] = useState([]);
  const [attendance, setAttendance] = useState({ rows: [], summary: [] });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState({ type: "idle", message: "" });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCourse, setResourceCourse] = useState("all");

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
      .then(async (data) => {
        if (!active) return;
        setLearning({ enrollments: data.enrollments || [], resources: data.resources || [] });
        const [notificationData, attendanceData, assignmentData] = await Promise.all(["notifications", "attendance", "assignments"].map((action) => fetch(`/api/student?action=${action}`, { headers: { Authorization: `Bearer ${user.token}` } }).then((response) => response.ok ? response.json() : {}).catch(() => ({}))));
        setNotifications(notificationData.notifications || []);
        setAttendance({ rows: attendanceData.attendance || [], summary: attendanceData.attendance_summary || [] });
        setAssignments(assignmentData.assignments || []);
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
  const paymentTotals = useMemo(() => learning.enrollments.reduce((totals, item) => {
    const due = Number(item.payment_due || 0);
    const paid = Number(item.payment_paid || 0);
    totals.due += due;
    totals.paid += paid;
    totals.balance += Math.max(0, due - paid);
    return totals;
  }, { due: 0, paid: 0, balance: 0 }), [learning.enrollments]);

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
  const markNotificationRead = async (notificationId) => {
    setNotifications((rows) => rows.map((row) => String(row.id) === String(notificationId) ? { ...row, is_read: 1 } : row));
    await fetch("/api/student", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ action: "mark_notification_read", notification_id: notificationId }) }).catch(() => {});
  };

  const submitAssignment = async (assignment) => {
    const submissionUrl = window.prompt(`Submission link for ${assignment.title} (optional):`, assignment.submission_url || "");
    if (submissionUrl === null) return;
    const submissionNote = window.prompt("Submission note (optional):", assignment.submission_note || "");
    if (submissionNote === null) return;
    try {
      const response = await fetch("/api/student", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ action: "submit_assignment", assignment_id: assignment.id, submission_url: submissionUrl, submission_note: submissionNote }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to submit assignment.");
      setAssignments(data.assignments || []);
      setNotice({ type: "success", message: "Assignment submitted." });
    } catch (error) { setNotice({ type: "error", message: error.message }); }
  };

  const downloadResource = async (resource) => {
    try {
      const response = await fetch("/api/student", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ action: "download_resource", resource_id: resource.id }) });
      const data = await response.json().catch(() => ({}));
      const target = data.url || resource.url;
      if (target) window.open(target, "_blank", "noopener,noreferrer");
    } catch (_) {
      if (resource.url) window.open(resource.url, "_blank", "noopener,noreferrer");
    }
  };

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

  const resourceCourses = useMemo(() => {
    const seen = new Map();
    learning.resources.forEach((resource) => {
      const key = String(resource.course_id);
      if (!seen.has(key)) seen.set(key, { id: key, title: resource.course_title || "Course resources", subject: resource.course_subject || "" });
    });
    return [...seen.values()];
  }, [learning.resources]);

  const filteredResources = useMemo(() => {
    const query = resourceSearch.trim().toLowerCase();
    return learning.resources.filter((resource) => {
      const matchesCourse = resourceCourse === "all" || String(resource.course_id) === resourceCourse;
      const haystack = [resource.title, resource.note, resource.resource_type, resource.course_title, resource.course_subject].join(" ").toLowerCase();
      return matchesCourse && (!query || haystack.includes(query));
    });
  }, [learning.resources, resourceCourse, resourceSearch]);

  const resourcesByCourse = useMemo(() => {
    const grouped = new Map();
    filteredResources.forEach((resource) => {
      const key = String(resource.course_id);
      if (!grouped.has(key)) grouped.set(key, { courseId: key, title: resource.course_title || "Course resources", items: [] });
      grouped.get(key).items.push(resource);
    });
    return [...grouped.values()];
  }, [filteredResources]);

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="eyebrow">Student portal · Personal workspace</span>
            <h1>My Learning</h1>
            <p>Welcome back, <strong>{display(user.name)}</strong>. Your courses, resources, and payment progress are all in one place.</p>
            <div className="dashboard-hero-meta"><span>Student ID: {display(user.student_id)}</span><span className="dashboard-account-status">{statusLabel(user.status)}</span></div>
          </div>
          <div className="dashboard-hero-actions"><Link to="/courses" className="button button-primary">Explore courses</Link><button type="button" className="button button-ghost-dark" onClick={handleLogout}>Logout</button></div>
        </div>

        {notice.type !== "idle" && <p className={`form-status form-status-${notice.type}`} role="status">{notice.message}</p>}

        {notifications.length > 0 && <section className="dashboard-card dashboard-notifications-card"><div className="dashboard-card-heading"><div><span className="eyebrow">Updates</span><h3>Notifications</h3></div><span className="dashboard-resource-count">{notifications.filter((item) => !Number(item.is_read)).length} unread</span></div><div className="dashboard-notification-list">{notifications.slice(0, 5).map((item) => <button className={`dashboard-notification ${Number(item.is_read) ? "read" : "unread"}`} key={item.id} onClick={() => markNotificationRead(item.id)}><span className="dashboard-notification-dot"/><span><strong>{item.title}</strong><small>{item.message}</small></span><time>{item.priority}</time></button>)}</div></section>}

        <div className="dashboard-metrics">
          <div className="dashboard-metric dashboard-metric-primary"><strong>{courseCount}</strong><span>Active courses</span><small>Approved or completed</small></div>
          <div className="dashboard-metric"><strong>{pendingCount}</strong><span>Awaiting review</span><small>Requests being reviewed</small></div>
          <div className="dashboard-metric"><strong>{learning.resources.length}</strong><span>Resources</span><small>Available to you</small></div>
          <div className="dashboard-metric dashboard-metric-balance"><strong>{formatAmount(paymentTotals.balance)}</strong><span>Balance remaining</span><small>Across all enrollments</small></div>
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
                    <div className={`dashboard-payment dashboard-payment-${enrollment.payment_status || "unpaid"}`}><div><span>Payment</span><strong>{(enrollment.payment_status || "unpaid").toUpperCase()}</strong></div><div><span>Total</span><strong>{formatAmount(enrollment.payment_due)}</strong></div><div><span>Paid</span><strong>{formatAmount(enrollment.payment_paid)}</strong></div><div><span>Balance</span><strong>{formatAmount(Math.max(0, Number(enrollment.payment_due || 0) - Number(enrollment.payment_paid || 0)))}</strong></div></div>
                    {(enrollment.payment_method || enrollment.payment_reference || enrollment.payment_due_date || enrollment.payment_paid_date) && <small className="dashboard-payment-meta">{enrollment.payment_method || "Payment method not provided"}{enrollment.payment_reference ? ` · Ref: ${enrollment.payment_reference}` : ""}{enrollment.payment_due_date ? ` · Due: ${String(enrollment.payment_due_date).slice(0, 10)}` : ""}{enrollment.payment_paid_date ? ` · Paid: ${String(enrollment.payment_paid_date).slice(0, 10)}` : ""}</small>}
                    {(enrollment.admin_note || enrollment.student_note) && <small>{enrollment.admin_note || enrollment.student_note}</small>}
                    {enrollment.status === "pending" && <button className="button button-ghost-dark" disabled={busy === `cancel-${enrollment.id}`} onClick={() => cancelEnrollment(enrollment.id)}>{busy === `cancel-${enrollment.id}` ? "Cancelling…" : "Cancel request"}</button>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="dashboard-card dashboard-progress-card"><div className="dashboard-card-heading"><div><span className="eyebrow">Progress tracking</span><h3>Attendance</h3></div><span className="dashboard-resource-count">{attendance.rows.length} records</span></div>{attendance.summary.length === 0 ? <p>Attendance records will appear after your instructor marks a class.</p> : <div className="dashboard-attendance-grid">{attendance.summary.map((item) => <div className="dashboard-attendance-item" key={item.course_id}><strong>{item.attended || 0}/{item.total || 0}</strong><span>{learning.enrollments.find((row) => String(row.course_id) === String(item.course_id))?.course_title || "Course"}</span></div>)}</div>}</section>

        <section className="dashboard-card dashboard-assignments-card"><div className="dashboard-card-heading"><div><span className="eyebrow">Keep learning</span><h3>Assignments</h3></div><span className="dashboard-resource-count">{assignments.length} total</span></div>{assignments.length === 0 ? <p>No assignments have been published for your approved courses yet.</p> : <div className="dashboard-assignment-list">{assignments.slice(0, 8).map((item) => <article className="dashboard-assignment" key={item.id}><div><strong>{item.title}</strong><span>{item.course_title} · Due {item.due_date ? new Date(item.due_date).toLocaleDateString() : "No due date"}</span></div><div className="dashboard-assignment-actions"><b className={`assignment-status ${item.submission_status || "pending"}`}>{item.submission_status ? item.submission_status.toUpperCase() : "NOT SUBMITTED"}</b>{!item.submission_status || item.submission_status === "returned" ? <button className="button button-ghost-dark" onClick={() => submitAssignment(item)}>Submit</button> : null}</div></article>)}</div>}</section>

        <section className="dashboard-card dashboard-resources-card">
          <div className="dashboard-card-heading">
            <div><h3>Course Resources</h3><p>Files, PDFs, ZIP archives, YouTube videos, and notes for your approved courses.</p></div>
            <span className="dashboard-resource-count">{filteredResources.length} result{filteredResources.length === 1 ? "" : "s"}</span>
          </div>
          <div className="dashboard-resource-toolbar">
            <label className="dashboard-resource-search"><span className="sr-only">Search resources</span><input type="search" value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder="Search title, note, or resource type…" /></label>
            <label className="dashboard-resource-filter"><span className="sr-only">Filter by course or subject</span><select value={resourceCourse} onChange={(event) => setResourceCourse(event.target.value)}><option value="all">All courses and subjects</option>{resourceCourses.map((course) => <option key={course.id} value={course.id}>{course.title}{course.subject ? ` · ${course.subject}` : ""}</option>)}</select></label>
            {(resourceSearch || resourceCourse !== "all") && <button className="button button-ghost-dark dashboard-resource-clear" onClick={() => { setResourceSearch(""); setResourceCourse("all"); }}>Clear filters</button>}
          </div>
          {loading ? <p>Loading course resources…</p> : learning.resources.length === 0 ? <p>Resources will appear here after an admin approves your course enrollment.</p> : resourcesByCourse.length === 0 ? <div className="dashboard-resource-empty"><strong>No matching resources</strong><span>Try another search word or choose a different course/subject.</span></div> : (
            <div className="dashboard-resource-groups">
              {resourcesByCourse.map((group) => (
                <div className="dashboard-resource-group" key={group.title}>
                  <div className="dashboard-resource-group-heading"><div><span className="eyebrow">Learning library</span><h4>{group.title}</h4></div><span>{group.items.length} item{group.items.length === 1 ? "" : "s"}</span></div>
                  <div className="dashboard-resource-list">
                    {group.items.map((resource) => (
                      <article className="dashboard-resource" key={resource.id}>
                        <div className="dashboard-resource-icon" aria-hidden="true">{resourceTypeOf(resource) === "youtube" ? "▶" : resourceTypeOf(resource) === "note" ? "✎" : resourceTypeOf(resource) === "pdf" ? "▣" : "↓"}</div>
                        <div className="dashboard-resource-body"><strong>{resource.title}</strong>{resource.note && <p>{resource.note}</p>}<span>{resourceTypeOf(resource).toUpperCase()}</span></div>
                        {resource.url && resourceTypeOf(resource) === "youtube" ? <button className="button button-ghost-dark" onClick={() => setViewer(resource)}>Watch</button> : resource.url ? <button className="button button-ghost-dark" onClick={() => downloadResource(resource)}>{resourceTypeOf(resource) === "pdf" ? "Download PDF" : resourceTypeOf(resource) === "note" ? "Open" : "Download"}</button> : null}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {viewer && <ResourceViewer resource={viewer} onClose={() => setViewer(null)} />}
      </div>
    </div>
  );
}
