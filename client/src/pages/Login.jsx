import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(role) {
    setError("");
    setLoading(true);
    try {
      const creds =
        role === "elderly"
          ? { email: "senior@demo.com", password: "password123" }
          : { email: "caregiver@demo.com", password: "password123" };
      const data = await api.login(creds);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card-container">
      <div className="card auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h1>Welcome Back</h1>
          <p className="auth-desc">Log in to view your schedule or check on your loved one.</p>
        </div>

        {/* Quick Demo Logins for fast evaluation */}
        <div className="quick-demo-box">
          <span className="quick-demo-title">⚡ Quick 1-Click Demo Login:</span>
          <div className="quick-demo-buttons">
            <button
              type="button"
              className="btn-quick-demo senior-demo"
              onClick={() => handleQuickLogin("elderly")}
              disabled={loading}
            >
              👵 Senior Citizen Mode (Grandma Eleanor)
            </button>
            <button
              type="button"
              className="btn-quick-demo caregiver-demo"
              onClick={() => handleQuickLogin("caregiver")}
              disabled={loading}
            >
              🩺 Caregiver Hub Mode (Alex)
            </button>
          </div>
        </div>

        <div className="auth-divider">
          <span>or log in with your email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email Address
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="alert-box alert-danger">{error}</div>}

          <button type="submit" className="btn-primary btn-large" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account yet? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
