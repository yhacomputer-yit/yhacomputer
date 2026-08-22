import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSiteData } from "../data.jsx";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/courses", label: "Courses" },
  { to: "/teachers", label: "Teachers" },
  { to: "/events", label: "Events" },
  { to: "/reviews", label: "Reviews" },
  { to: "/about-us", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };
  const { notifications: publicNotifications } = useSiteData();
  const [privateNotifications, setPrivateNotifications] = useState([]);
  const notifications = [...privateNotifications, ...publicNotifications]
    .filter((notification, index, list) => list.findIndex((item) => String(item.id) === String(notification.id)) === index)
    .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
  const notifRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    if (!user?.token) {
      setPrivateNotifications([]);
      return () => { active = false; };
    }
    fetch("/api/student?action=notifications", {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => (response.ok ? response.json() : { notifications: [] }))
      .then((data) => {
        if (active) setPrivateNotifications(data.notifications || []);
      })
      .catch(() => {
        if (active) setPrivateNotifications([]);
      });
    return () => { active = false; };
  }, [user?.token]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="container nav-shell">
        <NavLink to="/" className="logo" aria-label="YHA Computer home">
          <span className="logo-mark">Y</span>
          <span className="logo-copy">
            <strong>YHA</strong>
            <small>Computer Training</small>
          </span>
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul className={"nav-links" + (open ? " is-open" : "")}>
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            </li>
          ))}
          {user ? (
            <>
              <li>
                <NavLink to="/student/dashboard">Dashboard</NavLink>
              </li>
              <li className="nav-notif-item" ref={notifRef}>
                <button
                  type="button"
                  className="nav-notif-btn"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((v) => !v)}
                >
                  &#128276;
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="notif-panel">
                    <div className="notif-panel-header">
                      <h4>Notifications</h4>
                      <NavLink to="/notifications" className="notif-view-all" onClick={() => setNotifOpen(false)}>View all</NavLink>
                      <button
                        type="button"
                        className="notif-close"
                        onClick={() => setNotifOpen(false)}
                      >
                        &times;
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No notifications yet.</p>
                    ) : (
                      <ul className="notif-list">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={"notif-item" + (n.is_read ? " is-read" : "")}
                          >
                            <strong>{n.title}</strong>
                            {n.message && <p>{n.message}</p>}
                            <small>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
              <li>
                <button type="button" className="nav-logout" onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className="nav-auth-link">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register" className="nav-auth-link nav-admin-link">Register</NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
