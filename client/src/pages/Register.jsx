import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "elderly",
    phone: "",
    emergencyPhone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register(form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card-container">
      <div className="card auth-card">
        <div className="auth-header">
          <span className="auth-icon">📝</span>
          <h1>Create an Account</h1>
          <p className="auth-desc">
            Sign up for the <strong>SilverCare</strong> elderly schedule & alert network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full Name
            <input
              type="text"
              placeholder="e.g. Grandma Eleanor or Robert Smith"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>

          <label>
            Password <span className="helper-text">(at least 8 characters)</span>
            <input
              type="password"
              placeholder="••••••••"
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>

          <div className="role-selector-group">
            <span className="group-label">I am registering as:</span>
            <div className="role-options">
              <label className={`role-option-card ${form.role === "elderly" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="elderly"
                  checked={form.role === "elderly"}
                  onChange={() => update("role", "elderly")}
                />
                <span className="role-icon">👵👴</span>
                <div className="role-text">
                  <strong>Senior Citizen (65+)</strong>
                  <small>Follow my daily routine & get reminders</small>
                </div>
              </label>

              <label className={`role-option-card ${form.role === "caregiver" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="caregiver"
                  checked={form.role === "caregiver"}
                  onChange={() => update("role", "caregiver")}
                />
                <span className="role-icon">🩺🧑‍⚕️</span>
                <div className="role-text">
                  <strong>Caregiver / Family</strong>
                  <small>Monitor routines & receive missed schedule alerts</small>
                </div>
              </label>
            </div>
          </div>

          <label>
            Phone Number <span className="helper-text">(Used for alert calls & SMS)</span>
            <input
              type="tel"
              placeholder="e.g. (555) 234-5678"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>

          {form.role === "elderly" && (
            <label>
              Emergency / Caregiver Phone Number
              <input
                type="tel"
                placeholder="e.g. Caregiver's direct mobile number"
                value={form.emergencyPhone}
                onChange={(e) => update("emergencyPhone", e.target.value)}
              />
            </label>
          )}

          {error && <div className="alert-box alert-danger">{error}</div>}

          <button type="submit" className="btn-primary btn-large" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account & Start"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
