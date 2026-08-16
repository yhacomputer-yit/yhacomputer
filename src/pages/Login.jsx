import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSeo } from "../seo.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ student_id: "", password: "" });
  const [helpEmail, setHelpEmail] = useState("");
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  useSeo({
    title: "Student Login",
    description: "Login to your YHA Computer student account.",
    url: "/login",
  });

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: mode === "help" ? "Sending request…" : "Logging in…" });
    try {
      const response = await fetch(mode === "help" ? "/api/student" : "/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "help" ? { action: "request_password_help", student_id: form.student_id, email: helpEmail } : { ...form, action: "login" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }
      if (mode === "help") {
        setStatus({ type: "success", message: data.message || "Your password-help request was sent." });
        return;
      }
      login({ ...data.student, token: data.token });
      navigate("/student/dashboard");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Student portal</span>
          <h1>Welcome back</h1>
          <p>{mode === "help" ? "Confirm your Student ID and account email." : "Login with your student ID and password."}</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Student ID
            <input
              type="text"
              name="student_id"
              value={form.student_id}
              onChange={onChange}
              placeholder="e.g. YHA0001"
              autoComplete="username"
              required
            />
          </label>
          {mode === "help" ? (
            <label>
              Account Email
              <input type="email" value={helpEmail} onChange={(event) => setHelpEmail(event.target.value)} placeholder="you@example.com" required />
            </label>
          ) : (
            <label>
              Password
              <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Enter your password" autoComplete="current-password" required />
            </label>
          )}
          <button
            type="submit"
            className="button button-primary"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Working…" : mode === "help" ? "Request password help" : "Login"}
            <span>&rarr;</span>
          </button>
          {status.type !== "idle" && (
            <p className={"form-status form-status-" + status.type} role="status">
              {status.message}
            </p>
          )}
          <p className="auth-footer">
            {mode === "login" ? <><button type="button" className="text-button" onClick={() => { setMode("help"); setStatus({ type: "idle", message: "" }); }}>Forgot password?</button><br />Don&apos;t have an account? <Link to="/register">Register here</Link></> : <button type="button" className="text-button" onClick={() => { setMode("login"); setStatus({ type: "idle", message: "" }); }}>Back to login</button>}
          </p>
        </form>
      </div>
    </div>
  );
}
