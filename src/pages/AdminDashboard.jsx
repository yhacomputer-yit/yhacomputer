import { useState, useEffect, useCallback } from "react";
import { useSiteData } from "../data.jsx";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

const SCHEMA = {
  courses: {
    label: "Course",
    plural: "Courses",
    description: "Manage the courses displayed across the public catalog.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "subject",
        label: "Subject",
        type: "select",
        required: true,
        options: ["Ict", "Programming", "Graphic design"],
      },
      { name: "level", label: "Level", type: "text" },
      { name: "duration", label: "Duration", type: "text" },
      { name: "price", label: "Price", type: "text" },
      { name: "image", label: "Course image", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "highlights", label: "Highlights", type: "textarea" },
    ],
  },
  events: {
    label: "Event",
    plural: "Events",
    description: "Publish workshops, activities, and upcoming learning events.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category", label: "Category (pill)", type: "text" },
      { name: "event_type", label: "Type", type: "text" },
      { name: "date", label: "Date", type: "text" },
      { name: "venue", label: "Venue", type: "text" },
      { name: "duration", label: "Duration", type: "text" },
      { name: "image", label: "Event images (pipe-separated URLs)", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  reviews: {
    label: "Review",
    plural: "Reviews",
    description: "Manage student feedback displayed on the reviews page.",
    fields: [
      { name: "name", label: "Student name", type: "text", required: true },
      { name: "course_name", label: "Course", type: "text" },
      { name: "message", label: "Message", type: "textarea", required: true },
    ],
  },
  contacts: {
    label: "Contact submission",
    plural: "Contact submissions",
    description: "Read and manage messages submitted from the public contact form.",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "message", label: "Message", type: "textarea" },
    ],
    readOnly: true,
  },
  notifications: {
    label: "Notification",
    plural: "Notifications",
    description: "Send and manage push notifications to app users.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "message", label: "Message", type: "textarea", required: true },
      { name: "course_id", label: "Course ID", type: "text" },
      {
        name: "is_read",
        label: "Is Read",
        type: "select",
        options: ["0", "1"],
      },
    ],
  },
};

const SIDEBAR_ITEMS = [
  { key: "courses", label: "Courses", icon: "📚" },
  { key: "events", label: "Events", icon: "📅" },
  { key: "reviews", label: "Reviews", icon: "⭐" },
  { key: "contacts", label: "Contacts", icon: "📩" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
];

function toArg(value) {
  if (value == null || value === "") return { type: "null" };
  return { type: "text", value: String(value) };
}

async function adminApi(password, options) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
    },
    body: JSON.stringify(options),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed (" + res.status + ")");
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [tableData, setTableData] = useState({});
  const [tableLoading, setTableLoading] = useState({});
  const [tableError, setTableError] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const { notifications: siteNotifications, loading: dataLoading } =
    useSiteData();

  const loadTable = useCallback(
    async (table, pw) => {
      setTableLoading((prev) => ({ ...prev, [table]: true }));
      setTableError((prev) => ({ ...prev, [table]: "" }));
      try {
        const data = await adminApi(pw, { action: "list", table });
        setTableData((prev) => ({ ...prev, [table]: data.rows || [] }));
      } catch (err) {
        setTableError((prev) => ({
          ...prev,
          [table]: err.message || "Failed to load.",
        }));
      } finally {
        setTableLoading((prev) => ({ ...prev, [table]: false }));
      }
    },
    []
  );

  useEffect(() => {
    if (authenticated) {
      SIDEBAR_ITEMS.forEach((item) => {
        if (!tableData[item.key] && !tableLoading[item.key]) {
          loadTable(item.key, password);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, password]);

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
        loadTable("courses", password);
        loadTable("events", password);
        loadTable("reviews", password);
        loadTable("contacts", password);
        loadTable("notifications", password);
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
    setTableData({});
    setTableLoading({});
    setTableError({});
    setEditingId(null);
    setFormValues({});
    setFormError("");
    setFormSuccess("");
  };

  const handleSelectTable = (table) => {
    setActiveTab(table);
    setEditingId(null);
    setFormValues({});
    setFormError("");
    setFormSuccess("");
    setSidebarOpen(false);
    if (!tableData[table] && !tableLoading[table] && authenticated) {
      loadTable(table, password);
    }
  };

  const handleRefresh = () => {
    loadTable(activeTab, password);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    const schema = SCHEMA[activeTab];
    const values = {};
    schema.fields.forEach((f) => {
      values[f.name] = row[f.name] == null ? "" : row[f.name];
    });
    setFormValues(values);
    setFormError("");
    setFormSuccess("");
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormValues({});
    setFormError("");
    setFormSuccess("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await adminApi(password, {
        action: "delete",
        table: activeTab,
        id,
      });
      setTableData((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).filter((r) => r.id !== id),
      }));
      if (editingId === id) {
        setEditingId(null);
        setFormValues({});
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSaving(true);
    try {
      const schema = SCHEMA[activeTab];
      const missing = schema.fields.find(
        (f) => f.required && !formValues[f.name]
      );
      if (missing) {
        setFormError(missing.label + " is required.");
        setSaving(false);
        return;
      }

      const values = {};
      schema.fields.forEach((f) => {
        values[f.name] = formValues[f.name];
      });

      if (editingId) {
        await adminApi(password, {
          action: "update",
          table: activeTab,
          id: editingId,
          values,
        });
        setTableData((prev) => {
          const list = prev[activeTab] || [];
          return {
            ...prev,
            [activeTab]: list.map((r) =>
              r.id === editingId ? { ...r, ...values } : r
            ),
          };
        });
        setFormSuccess("Record updated successfully.");
      } else {
        const data = await adminApi(password, {
          action: "create",
          table: activeTab,
          values,
        });
        const newRow = { id: Date.now(), ...values, created_at: new Date().toISOString() };
        setTableData((prev) => ({
          ...prev,
          [activeTab]: [newRow, ...(prev[activeTab] || [])],
        }));
        setFormSuccess("Record created successfully.");
      }

      setEditingId(null);
      setFormValues({});
    } catch (err) {
      setFormError(err.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateFormValue = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const renderField = (field) => {
    const value = formValues[field.name] || "";
    const commonStyle = {
      width: "100%",
      padding: "10px 14px",
      border: "1px solid var(--line)",
      borderRadius: 10,
      fontSize: 14,
      outline: "none",
      background: "var(--surface)",
      color: "var(--ink)",
    };

    if (field.type === "textarea") {
      return (
        <textarea
          key={field.name}
          value={value}
          onChange={(e) => updateFormValue(field.name, e.target.value)}
          required={field.required}
          rows={3}
          placeholder={field.label}
          style={{ ...commonStyle, resize: "vertical" }}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          key={field.name}
          value={value}
          onChange={(e) => updateFormValue(field.name, e.target.value)}
          required={field.required}
          style={commonStyle}
        >
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        key={field.name}
        type={field.type === "images" || field.type === "image" ? "text" : field.type}
        value={value}
        onChange={(e) => updateFormValue(field.name, e.target.value)}
        required={field.required}
        placeholder={field.label}
        style={commonStyle}
      />
    );
  };

  const renderListItem = (row) => {
    const schema = SCHEMA[activeTab];
    const primary = schema.fields[0].name;
    const secondary = schema.fields[1] ? schema.fields[1].name : null;
    const bodyField = schema.fields.find((f) => f.type === "textarea");

    const displayValue = (val) => {
      if (val == null || val === "") return "";
      if (typeof val !== "string") return String(val);
      if (val.length > 120) return val.slice(0, 120) + "...";
      return val;
    };

    return (
      <li
        key={row.id}
        style={{
          padding: 14,
          border: "1px solid var(--line)",
          borderRadius: 12,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 14 }}>
              {displayValue(row[primary]) || "Untitled"}
            </strong>
            {secondary && row[secondary] && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: "var(--muted)",
                  background: "var(--paper)",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {displayValue(row[secondary])}
              </span>
            )}
            {bodyField && row[bodyField.name] && (
              <p
                style={{
                  margin: "6px 0 0",
                  color: "var(--muted)",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {displayValue(row[bodyField.name])}
              </p>
            )}
            {row.created_at && (
              <small
                style={{
                  color: "var(--on-surface-variant)",
                  fontSize: 12,
                }}
              >
                {new Date(row.created_at).toLocaleString()}
              </small>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {!schema.readOnly && (
              <button
                className="btn-mini"
                onClick={() => handleEdit(row)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Edit
              </button>
            )}
            <button
              className="btn-mini btn-danger"
              onClick={() => handleDelete(row.id)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--danger)",
                background: "#fff",
                color: "var(--danger)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    );
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

  const currentSchema = SCHEMA[activeTab];
  const items = tableData[activeTab] || [];
  const loading = tableLoading[activeTab];
  const error = tableError[activeTab];

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span className="admin-logo-mark">Y</span>
            <div>
              <strong>YHA Computer</strong>
              <small>Admin</small>
            </div>
          </div>
          <button
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`admin-sidebar-link ${activeTab === item.key ? "is-active" : ""}`}
              onClick={() => handleSelectTable(item.key)}
            >
              <span className="admin-sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-sidebar-logout">
            Log out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="admin-topbar-title">
            <h1>{currentSchema.plural}</h1>
            <p>{currentSchema.description}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="admin-refresh-btn"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: loading ? "var(--muted)" : "var(--surface)",
              color: loading ? "#fff" : "var(--ink)",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        <div className="admin-workspace">
          {!currentSchema.readOnly && (
            <div className="admin-form-panel">
              <div className="panel-header">
                <h2>{editingId ? "Edit " : "Add " + currentSchema.label}</h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleAddNew}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-fields">
                  {currentSchema.fields.map((field) => (
                    <label key={field.name}>
                      {field.label}
                      {field.required && (
                        <span style={{ color: "var(--danger)", marginLeft: 4 }}>
                          *
                        </span>
                      )}
                      {renderField(field)}
                    </label>
                  ))}
                </div>
                {formError && (
                  <p className="admin-error" style={{ color: "var(--danger)", fontSize: 14 }}>
                    {formError}
                  </p>
                )}
                {formSuccess && (
                  <p
                    className="admin-success"
                    style={{ color: "var(--success)", fontSize: 14 }}
                  >
                    {formSuccess}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    background: "var(--orange)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </form>
            </div>
          )}
          {currentSchema.readOnly && (
            <div className="admin-form-panel admin-form-panel-readonly">
              <div className="panel-header">
                <h2>{currentSchema.label} info</h2>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
                {currentSchema.description} Use the list panel to view and delete
                individual records.
              </p>
            </div>
          )}

          <div className="admin-list-panel">
            <div className="list-header">
              <div>
                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                  Database records
                </span>
                <h2>{currentSchema.plural}</h2>
              </div>
              <strong
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  background: "var(--paper)",
                  padding: "4px 12px",
                  borderRadius: 8,
                }}
              >
                {items.length}
              </strong>
            </div>
            {error && (
              <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 12 }}>
                {error}
              </p>
            )}
            {loading && items.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading...</p>
            ) : items.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                No records yet.
              </p>
            ) : (
              <ul className="admin-record-list">
                {items.map((row) => renderListItem(row))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
