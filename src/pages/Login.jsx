import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSeo } from "../seo.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ student_id: "", password: "" });
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
    setStatus({ type: "loading", message: "Logging in…" });
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, action: "login" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
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
          <p>Login with your student ID and password.</p>
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
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            className="button button-primary"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? "Logging in…" : "Login"}
            <span>&rarr;</span>
          </button>
          {status.type !== "idle" && (
            <p className={"form-status form-status-" + status.type} role="status">
              {status.message}
            </p>
          )}
          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
