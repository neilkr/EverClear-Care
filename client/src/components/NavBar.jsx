import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useState, useEffect } from "react";

export default function NavBar() {
  const { user, logout } = useAuth();
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem("elderly_large_font") === "true");

  useEffect(() => {
    if (largeFont) {
      document.body.classList.add("large-text-mode");
    } else {
      document.body.classList.remove("large-text-mode");
    }
    localStorage.setItem("elderly_large_font", largeFont);
  }, [largeFont]);

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon" aria-hidden="true">💙</span>
        <div className="brand-text">
          <span className="brand-title">SilverCare</span>
          <span className="brand-subtitle">Elderly Alert & Daily Schedule</span>
        </div>
      </Link>

      <div className="nav-right">
        <button
          type="button"
          className="btn-accessibility"
          onClick={() => setLargeFont((v) => !v)}
          title="Toggle Extra Large Text Mode for easier reading"
        >
          {largeFont ? "🔍 Standard Text" : "🔍 Senior Large Text"}
        </button>

        {user ? (
          <div className="user-section">
            <span className="user-badge">
              <strong>{user.name}</strong>
              <span className={`role-pill role-${user.role}`}>
                {user.role === "elderly" ? "Senior Citizen" : "Caregiver"}
              </span>
            </span>
            <button type="button" className="btn-logout" onClick={logout}>
              Log out
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="nav-link">Log in</Link>
            <Link to="/register" className="nav-link nav-btn-primary">Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
}
