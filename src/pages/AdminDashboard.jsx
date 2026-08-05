import { useState, useEffect, useCallback } from "react";
import { useSiteData } from "../data.jsx";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

function toArg(value) {
  if (value == null || value === "") return { type: "null" };
  return { type: "text", value: String(value) };
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifCourseId, setNotifCourseId] = useState("");
  const [notifError, setNotifError] = useState("");
  const [notifSuccess, setNotifSuccess] = useState("");
  const { notifications: siteNotifications, loading: dataLoading } =
    useSiteData();

  useEffect(() => {
    if (authenticated && notifications.length === 0 && !dataLoading) {
      setNotifications(siteNotifications || []);
    }
  }, [authenticated, siteNotifications, dataLoading, notifications.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setPasswordError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list",
          table: "courses",
          password,
        }),
      });
      if (res.ok) {
        setAuthenticated(true);
        setNotifications(siteNotifications || []);
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Invalid password.");
      }
    } catch {
      setPasswordError("Unable to connect to the server.");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword("");
    setPasswordError("");
    setNotifications([]);
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifError("");
    setNotifSuccess("");
    setSending(true);
    try {
      const values = {
        title: notifTitle,
        message: notifMessage,
        course_id: notifCourseId ? parseInt(notifCourseId, 10) : null,
        is_read: 0,
      };
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          table: "notifications",
          values,
          password,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setNotifSuccess("Notification sent successfully.");
        setNotifTitle("");
        setNotifMessage("");
        setNotifCourseId("");
        setNotifications((prev) => [
          { id: Date.now(), title: notifTitle, message: notifMessage, course_id: notifCourseId ? parseInt(notifCourseId, 10) : null, is_read: false, created_at: new Date().toISOString() },
          ...prev,
        ]);
      } else {
        setNotifError(data.error || "Failed to send notification.");
      }
    } catch {
      setNotifError("Unable to connect to the server.");
    } finally {
      setSending(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="detail-page">
        <div className="container">
          <div className="detail-card" style={{ maxWidth: 480, margin: "0 auto" }}>
            <div className="detail-body">
              <h1>Admin Login</h1>
              <p style={{ color: "var(--muted)", marginBottom: 24 }}>
                Enter the admin password to access the dashboard.
              </p>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="admin-password"
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                </div>
                {passwordError && (
                  <p style={{ color: "var(--danger)", marginBottom: 12, fontSize: 14 }}>
                    {passwordError}
                  </p>
                )}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "var(--orange)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="container">
        <div className="detail-card" style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="detail-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <h1>Admin Dashboard</h1>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "1px solid var(--line)",
                  padding: "8px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Log out
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                borderBottom: "1px solid var(--line)",
                paddingBottom: 12,
              }}
            >
              {[
                { key: "notifications", label: "Notifications" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      activeTab === tab.key
                        ? "var(--orange)"
                        : "var(--background)",
                    color: activeTab === tab.key ? "#fff" : "var(--muted)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "notifications" && (
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    marginBottom: 16,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Send Notification
                </h2>
                <form
                  onSubmit={handleSendNotification}
                  style={{
                    display: "grid",
                    gap: 16,
                    marginBottom: 32,
                    padding: 20,
                    border: "1px solid var(--line)",
                    borderRadius: 16,
                    background: "var(--surface)",
                  }}
                >
                  <div>
                    <label
                      htmlFor="notif-title"
                      style={{
                        display: "block",
                        marginBottom: 6,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Title *
                    </label>
                    <input
                      id="notif-title"
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      required
                      placeholder="e.g. New Course Available"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        fontSize: 16,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="notif-message"
                      style={{
                        display: "block",
                        marginBottom: 6,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Message *
                    </label>
                    <textarea
                      id="notif-message"
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      required
                      rows={3}
                      placeholder="e.g. A new course has been opened: Web Development Bootcamp"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        fontSize: 16,
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="notif-course-id"
                      style={{
                        display: "block",
                        marginBottom: 6,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Course ID (optional)
                    </label>
                    <input
                      id="notif-course-id"
                      type="number"
                      value={notifCourseId}
                      onChange={(e) => setNotifCourseId(e.target.value)}
                      placeholder="Leave empty if not related to a specific course"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        fontSize: 16,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {notifError && (
                    <p style={{ color: "var(--danger)", fontSize: 14 }}>
                      {notifError}
                    </p>
                  )}
                  {notifSuccess && (
                    <p style={{ color: "var(--success)", fontSize: 14 }}>
                      {notifSuccess}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      padding: "14px 24px",
                      background: "var(--orange)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: sending ? "not-allowed" : "pointer",
                      opacity: sending ? 0.6 : 1,
                    }}
                  >
                    {sending ? "Sending..." : "Send Notification"}
                  </button>
                </form>

                <h2
                  style={{
                    fontSize: 20,
                    marginBottom: 16,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Recent Notifications ({notifications.length})
                </h2>
                {notifications.length === 0 ? (
                  <p style={{ color: "var(--muted)" }}>
                    No notifications sent yet.
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        style={{
                          padding: 16,
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                          background: n.is_read
                            ? "var(--surface)"
                            : "var(--orange-soft)",
                        }}
                      >
                        <strong>{n.title}</strong>
                        <p
                          style={{
                            margin: "6px 0",
                            color: "var(--muted)",
                            fontSize: 14,
                          }}
                        >
                          {n.message}
                        </p>
                        <small style={{ color: "var(--on-surface-variant)" }}>
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString()
                            : "Unknown time"}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}