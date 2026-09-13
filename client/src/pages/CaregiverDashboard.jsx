import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

function format12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function getTaskIcon(title = "", category = "") {
  const t = (title + " " + category).toLowerCase();
  if (t.includes("walk") || t.includes("exercise")) return "🚶";
  if (t.includes("med") || t.includes("pill")) return "💊";
  if (t.includes("water") || t.includes("drink")) return "💧";
  if (t.includes("meal") || t.includes("lunch") || t.includes("dinner") || t.includes("breakfast")) return "🍲";
  if (t.includes("doctor") || t.includes("appoint")) return "🩺";
  return "⭐";
}

function playAlertChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log("Audio alert not allowed", e);
  }
}

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [linked, setLinked] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [viewTab, setViewTab] = useState("today"); // 'today' or 'all'
  const [newTask, setNewTask] = useState({ title: "", scheduledTime: "", category: "walk" });
  const [isLinking, setIsLinking] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [myPhone, setMyPhone] = useState(user?.phone || "");

  const previousAlertCount = useRef(0);

  const loadLinked = useCallback(async () => {
    try {
      const data = await api.linkedElderly();
      setLinked(data.elderly || []);
      // If we already had a selected person, keep them updated
      if (data.elderly && data.elderly.length > 0) {
        setSelected((prev) => {
          if (!prev) return data.elderly[0];
          const found = data.elderly.find((p) => p.id === prev.id);
          return found || data.elderly[0];
        });
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await api.alerts();
      const newAlerts = data.alerts || [];
      const unreadCount = newAlerts.filter((a) => !a.is_read).length;

      // Play chime if new unread alerts arrived
      if (unreadCount > previousAlertCount.current && previousAlertCount.current > 0) {
        playAlertChime();
      }
      previousAlertCount.current = unreadCount;
      setAlerts(newAlerts);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadSelectedSchedule = useCallback(async (personId) => {
    if (!personId) return;
    try {
      const [todayRes, allRes] = await Promise.all([
        api.elderlyTodayTasks(personId).catch(() => ({ tasks: [] })),
        api.elderlyTasks(personId).catch(() => ({ tasks: [] })),
      ]);
      setTodayTasks(todayRes.tasks || []);
      setAllTasks(allRes.tasks || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadLinked();
    loadAlerts();
    const interval = setInterval(() => {
      loadLinked();
      loadAlerts();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadLinked, loadAlerts]);

  useEffect(() => {
    if (selected?.id) {
      loadSelectedSchedule(selected.id);
    }
  }, [selected?.id, loadSelectedSchedule]);

  async function handleLink(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLinking(true);
    try {
      const res = await api.linkElderly(inviteCode);
      setInviteCode("");
      setSuccessMsg(`Successfully connected to ${res.linked.name}!`);
      await loadLinked();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to link. Check the invite code.");
    } finally {
      setIsLinking(false);
    }
  }

  async function handleAddTaskForSenior(e) {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setSuccessMsg("");
    try {
      await api.createTask({
        elderlyId: selected.id,
        title: newTask.title,
        scheduledTime: newTask.scheduledTime,
        category: newTask.category,
      });
      setSuccessMsg(`Added "${newTask.title}" at ${format12Hour(newTask.scheduledTime)} for ${selected.name}!`);
      setNewTask({ title: "", scheduledTime: "", category: "walk" });
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadSelectedSchedule(selected.id);
      await loadLinked();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTask(taskId, taskTitle) {
    if (!window.confirm(`Delete "${taskTitle}" from ${selected.name}'s schedule?`)) return;
    try {
      await api.deleteTask(taskId);
      setSuccessMsg(`Task "${taskTitle}" deleted.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadSelectedSchedule(selected.id);
      await loadLinked();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.markAlertRead(id);
      await loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllAlertsRead();
      await loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSavePhone(e) {
    e.preventDefault();
    try {
      await api.updateProfile({ phone: myPhone });
      setShowProfileEdit(false);
      setSuccessMsg("Caregiver phone number saved!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    }
  }

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  return (
    <div className="caregiver-dashboard-wrapper">
      {/* Header Banner */}
      <section className="caregiver-hero-card">
        <div className="hero-left">
          <span className="hero-badge">🩺 CAREGIVER MONITORING HUB</span>
          <h1 className="caregiver-heading">Welcome, {user.name}</h1>
          <p className="hero-subtext">
            Monitor daily schedules for senior loved ones and receive immediate alerts for missed routines.
          </p>
        </div>
        <div className="hero-right caregiver-profile-mini">
          <div className="phone-info-card">
            <span>My Contact Phone: <strong>{myPhone || "Not set"}</strong></span>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => setShowProfileEdit((s) => !s)}
            >
              {showProfileEdit ? "Cancel" : "⚙️ Edit Phone"}
            </button>
          </div>
          {showProfileEdit && (
            <form onSubmit={handleSavePhone} className="mini-phone-form">
              <input
                type="tel"
                placeholder="Caregiver phone e.g. (555) 123-4567"
                value={myPhone}
                onChange={(e) => setMyPhone(e.target.value)}
                required
              />
              <button type="submit" className="btn-secondary btn-sm">Save</button>
            </form>
          )}
        </div>
      </section>

      {/* Messages */}
      {successMsg && <div className="alert-box alert-success">✅ {successMsg}</div>}
      {error && <div className="alert-box alert-danger">⚠️ {error}</div>}

      {/* Top Grid: Link Form & Real-time Alert Center */}
      <section className="dashboard-grid-2col">
        {/* Link Senior Card */}
        <div className="card link-senior-card">
          <h2>🔗 Connect to a Senior Loved One</h2>
          <p className="card-desc-muted">
            Enter the 8-character invite code displayed on the senior citizen's app screen to link accounts.
          </p>
          <form onSubmit={handleLink} className="link-code-form">
            <input
              type="text"
              placeholder="e.g. a1b2c3d4"
              maxLength={32}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary" disabled={isLinking}>
              {isLinking ? "Connecting..." : "Connect Senior"}
            </button>
          </form>

          {/* Quick List of Linked Seniors */}
          <div className="linked-seniors-list">
            <h3>Connected Seniors ({linked.length})</h3>
            {linked.length === 0 ? (
              <p className="empty-text">No seniors linked yet. Ask for their invite code to get started!</p>
            ) : (
              <div className="seniors-chip-list">
                {linked.map((person) => {
                  const isCur = selected?.id === person.id;
                  const summary = person.todaySummary || { total: 0, completed: 0, missed: 0 };
                  return (
                    <div
                      key={person.id}
                      className={`senior-summary-card ${isCur ? "selected" : ""}`}
                      onClick={() => setSelected(person)}
                    >
                      <div className="senior-card-top">
                        <span className="senior-avatar-icon">👵</span>
                        <div>
                          <strong>{person.name}</strong>
                          <div className="senior-phone-text">
                            {person.phone ? `📞 ${person.phone}` : "No phone listed"}
                          </div>
                        </div>
                      </div>

                      <div className="senior-card-stats">
                        <span className="badge-pill bg-green">
                          {summary.completed}/{summary.total} Done
                        </span>
                        {summary.missed > 0 && (
                          <span className="badge-pill bg-red">
                            ⚠️ {summary.missed} Missed
                          </span>
                        )}
                      </div>

                      {person.phone && (
                        <div className="senior-quick-actions" onClick={(e) => e.stopPropagation()}>
                          <a href={`tel:${person.phone}`} className="btn-call-mini">
                            📞 Call
                          </a>
                          <a href={`sms:${person.phone}`} className="btn-sms-mini">
                            💬 SMS
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Alert Center */}
        <div className="card alerts-card">
          <div className="card-header-flex">
            <h2>
              🚨 Real-Time Alert Feed
              {unreadAlerts.length > 0 && (
                <span className="alert-count-pill">{unreadAlerts.length} New</span>
              )}
            </h2>
            {unreadAlerts.length > 0 && (
              <button type="button" className="btn-text-action" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <p className="card-desc-muted">
            Notifications are generated automatically when a scheduled routine is missed or when the senior requests assistance.
          </p>

          <div className="alerts-feed-list">
            {alerts.length === 0 ? (
              <div className="empty-alerts">
                <span className="empty-icon">🛡️</span>
                <p>No alerts recorded. Everything is on schedule!</p>
              </div>
            ) : (
              alerts.map((a) => {
                const isEmergency = a.alert_type === "emergency" || a.message.includes("URGENT");
                const isTest = a.alert_type === "test";
                const isCheckin = a.alert_type === "checkin";

                return (
                  <div
                    key={a.id}
                    className={`alert-item-card ${a.is_read ? "read" : "unread"} ${
                      isEmergency ? "alert-emergency" : isTest ? "alert-test" : isCheckin ? "alert-checkin" : "alert-missed"
                    }`}
                  >
                    <div className="alert-icon-wrap">
                      {isEmergency ? "🚨" : isTest ? "🧪" : isCheckin ? "👋" : "⚠️"}
                    </div>

                    <div className="alert-body">
                      <p className="alert-text-message">{a.message}</p>
                      <div className="alert-meta-row">
                        <span className="alert-time-stamp">
                          🕒 {new Date(a.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — {new Date(a.created_at).toLocaleDateString()}
                        </span>
                        {a.elderly_phone && (
                          <a href={`tel:${a.elderly_phone}`} className="alert-call-link">
                            📞 Call {a.elderly_name} ({a.elderly_phone})
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="alert-actions">
                      {!a.is_read ? (
                        <button
                          type="button"
                          className="btn-mark-read"
                          onClick={() => handleMarkRead(a.id)}
                          title="Acknowledge alert"
                        >
                          ✓ Acknowledge
                        </button>
                      ) : (
                        <span className="read-badge">Read</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Bottom Section: Selected Senior Schedule Management */}
      {selected ? (
        <section className="card senior-detail-management-card">
          <div className="management-header">
            <div>
              <h2>📋 Schedule & Routine for {selected.name}</h2>
              <p className="card-desc-muted">
                View real-time daily progress or add/edit routines on behalf of {selected.name}.
              </p>
            </div>

            <div className="view-toggle-buttons">
              <button
                type="button"
                className={`btn-toggle ${viewTab === "today" ? "active" : ""}`}
                onClick={() => setViewTab("today")}
              >
                Today's Live Progress ({todayTasks.length})
              </button>
              <button
                type="button"
                className={`btn-toggle ${viewTab === "all" ? "active" : ""}`}
                onClick={() => setViewTab("all")}
              >
                All Master Routines ({allTasks.length})
              </button>
            </div>
          </div>

          {/* Schedule List */}
          {viewTab === "today" ? (
            <div className="tasks-display-area">
              {todayTasks.length === 0 ? (
                <p className="empty-text">No tasks due today for {selected.name}.</p>
              ) : (
                <div className="caregiver-task-grid">
                  {todayTasks.map((t) => {
                    const icon = getTaskIcon(t.title, t.category);
                    const isCompleted = t.status === "completed";
                    const isMissed = t.status === "missed";

                    return (
                      <div key={t.id} className={`cg-task-card status-${t.status}`}>
                        <span className="cg-task-icon">{icon}</span>
                        <div className="cg-task-info">
                          <strong className="cg-task-time">{format12Hour(t.scheduled_time)}</strong>
                          <span className="cg-task-title">{t.title}</span>
                          <div className="cg-task-status-line">
                            {isCompleted ? (
                              <span className="status-badge-completed">✅ Completed at {t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Today"}</span>
                            ) : isMissed ? (
                              <span className="status-badge-missed">⚠️ Missed / Caregiver Alerted</span>
                            ) : (
                              <span className="status-badge-pending">⏳ Pending confirmation</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-task-icon"
                          onClick={() => handleDeleteTask(t.id, t.title)}
                          title="Remove task"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="tasks-display-area">
              {allTasks.length === 0 ? (
                <p className="empty-text">No recurring routines configured yet.</p>
              ) : (
                <div className="caregiver-task-grid">
                  {allTasks.map((t) => {
                    const icon = getTaskIcon(t.title, t.category);
                    return (
                      <div key={t.id} className="cg-task-card">
                        <span className="cg-task-icon">{icon}</span>
                        <div className="cg-task-info">
                          <strong className="cg-task-time">{format12Hour(t.scheduled_time)}</strong>
                          <span className="cg-task-title">{t.title}</span>
                          <small className="cg-days-text">Every Day</small>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-task-icon"
                          onClick={() => handleDeleteTask(t.id, t.title)}
                          title="Remove task"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Add Task for Senior Form */}
          <div className="caregiver-add-task-box">
            <h3>➕ Add Routine for {selected.name}</h3>
            <form onSubmit={handleAddTaskForSenior} className="cg-add-form">
              <input
                type="text"
                placeholder="e.g. Afternoon Walk, Heart Meds, Hydration"
                value={newTask.title}
                onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                required
              />
              <input
                type="time"
                value={newTask.scheduledTime}
                onChange={(e) => setNewTask((t) => ({ ...t, scheduledTime: e.target.value }))}
                required
              />
              <select
                value={newTask.category}
                onChange={(e) => setNewTask((t) => ({ ...t, category: e.target.value }))}
              >
                <option value="walk">🚶 Walk / Exercise</option>
                <option value="medication">💊 Medication</option>
                <option value="meal">🍲 Meal</option>
                <option value="hydration">💧 Hydration</option>
                <option value="doctor">🩺 Doctor / Health</option>
                <option value="general">⭐ General Routine</option>
              </select>
              <button type="submit" className="btn-primary">
                Add to Schedule
              </button>
            </form>
          </div>
        </section>
      ) : (
        <div className="card info-card-prompt">
          <p>Please connect or select a senior above to manage their schedules and routines.</p>
        </div>
      )}
    </div>
  );
}
