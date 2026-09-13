import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ElderlyDashboard from "./pages/ElderlyDashboard.jsx";
import CaregiverDashboard from "./pages/CaregiverDashboard.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === "elderly" ? (
                <ElderlyDashboard />
              ) : (
                <CaregiverDashboard />
              )
            }
          />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
