import { useSeo } from "../seo.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSiteData } from "../data.jsx";

function display(value) {
  return value || "Not provided";
}

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
            <div className="dashboard-card-heading">
              <div>
                <h3>Complete Profile</h3>
                <p>All information submitted during registration.</p>
              </div>
              {user.image && <img className="dashboard-profile-image" src={user.image} alt={user.name || "Student profile"} />}
            </div>
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
                <div><span>Duration</span><strong>{course.duration}</strong></div>
              )}
              {course && course.price && (
                <div><span>Course Fee</span><strong>{course.price}</strong></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
