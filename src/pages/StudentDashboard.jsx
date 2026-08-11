import { useSeo } from "../seo.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSiteData } from "../data.jsx";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { courses, sessions } = useSiteData();

  useSeo({
    title: "Student Dashboard",
    description: "View your YHA Computer student profile and courses.",
    url: "/student/dashboard",
  });

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="form-status form-status-error">Please login to view your dashboard.</p>
          <a href="/login" className="button button-primary">Go to Login</a>
        </div>
      </div>
    );
  }

  const course = courses.find((c) => String(c.id) === String(user.course_id));
  const session = sessions.find((s) => String(s.id) === String(user.session_id));

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <span className="eyebrow">Student portal</span>
            <h1>My Dashboard</h1>
          </div>
          <button className="button button-ghost-dark" onClick={logout}>Logout</button>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Profile</h3>
            <div className="dashboard-info">
              <div><span>Student ID</span><strong>{user.student_id}</strong></div>
              <div><span>Name</span><strong>{user.name}</strong></div>
              <div><span>Email</span><strong>{user.email}</strong></div>
              <div><span>Phone</span><strong>{user.phone}</strong></div>
              <div><span>Status</span><strong>{user.status}</strong></div>
            </div>
          </div>
          <div className="dashboard-card">
            <h3>Enrollment</h3>
            <div className="dashboard-info">
              <div>
                <span>Course</span>
                <strong>{course ? course.title : (user.course_id || "Not assigned")}</strong>
              </div>
              <div>
                <span>Session</span>
                <strong>{session ? session.name : (user.session_id || "Not assigned")}</strong>
              </div>
              {course && course.duration && (
                <div>
                  <span>Duration</span>
                  <strong>{course.duration}</strong>
                </div>
              )}
              {course && course.price && (
                <div>
                  <span>Course Fee</span>
                  <strong>{course.price}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
