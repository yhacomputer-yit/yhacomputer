import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSiteData } from "../data.jsx";
import { useSeo } from "../seo.js";

const READ_KEY = "yha_web_read_notifications_v1";

function readIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch { return new Set(); }
}

export default function Notifications() {
  const { user } = useAuth();
  const { notifications: publicNotifications } = useSiteData();
  const [privateNotifications, setPrivateNotifications] = useState([]);
  const [read, setRead] = useState(readIds);
  const [filter, setFilter] = useState("all");

  useSeo({ title: "Updates", description: "YHA Computer announcements and student updates.", url: "/notifications" });

  useEffect(() => {
    if (!user?.token) return undefined;
    let active = true;
    fetch("/api/student?action=notifications", { headers: { Authorization: `Bearer ${user.token}` } })
      .then((response) => (response.ok ? response.json() : { notifications: [] }))
      .then((data) => { if (active) setPrivateNotifications(data.notifications || []); })
      .catch(() => {});
    return () => { active = false; };
  }, [user?.token]);

  const notifications = useMemo(() => [...privateNotifications, ...publicNotifications]
    .filter((item, index, list) => list.findIndex((other) => String(other.id) === String(item.id)) === index)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [privateNotifications, publicNotifications]);
  const unread = notifications.filter((item) => !read.has(String(item.id)));
  const visible = filter === "unread" ? unread : notifications;

  const markRead = (id) => {
    const next = new Set(read);
    next.add(String(id));
    setRead(next);
    localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  };
  const markAllRead = () => {
    const next = new Set(notifications.map((item) => String(item.id)));
    setRead(next);
    localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  };

  return (
    <div className="page-shell container notifications-page">
      <div className="page-heading-row">
        <div><span className="eyebrow">Student updates</span><h1>Updates</h1><p>Announcements, profile approvals, and course enrollment updates.</p></div>
        <button type="button" className="button button-ghost-dark" onClick={markAllRead}>Mark all read</button>
      </div>
      <div className="notification-filters"><button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>All updates</button><button className={filter === "unread" ? "is-active" : ""} onClick={() => setFilter("unread")}>Unread{unread.length ? ` (${unread.length})` : ""}</button></div>
      {visible.length === 0 ? <div className="data-state"><strong>No updates yet.</strong><span>New announcements and approval messages will appear here.</span></div> : <div className="notification-feed">{visible.map((item) => <article key={item.id} className={`notification-card ${read.has(String(item.id)) ? "is-read" : "is-unread"}`} onClick={() => markRead(item.id)}><div><span className={`notification-priority notification-priority-${item.priority || "normal"}`}>{item.priority || "normal"}</span><h2>{item.title}</h2>{item.message && <p>{item.message}</p>}<small>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</small>{item.course_id && <Link to={`/courses/${item.course_id}`} onClick={(event) => event.stopPropagation()}>Open course</Link>}</div></article>)}</div>}
    </div>
  );
}
