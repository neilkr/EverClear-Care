import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const PRESET_TASKS = [
  { title: "Morning Walk", time: "08:00", category: "walk", icon: "🚶" },
  { title: "Morning Medication", time: "09:00", category: "medication", icon: "💊" },
  { title: "Healthy Lunch", time: "12:30", category: "meal", icon: "🍲" },
  { title: "Drink Water / Hydration", time: "15:00", category: "hydration", icon: "💧" },
  { title: "Afternoon Walk & Fresh Air", time: "17:30", category: "walk", icon: "🚶" },
  { title: "Evening Dinner", time: "19:00", category: "meal", icon: "🍲" },
  { title: "Evening Medication", time: "20:30", category: "medication", icon: "💊" },
];

function format12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function getTaskIcon(title = "", category = "") {
  const t = (title + " " + category).toLowerCase();
  if (t.includes("walk") || t.includes("exercise") || t.includes("step")) return "🚶";
  if (t.includes("med") || t.includes("pill") || t.includes("dose") || t.includes("drug")) return "💊";
  if (t.includes("water") || t.includes("drink") || t.includes("hydrat")) return "💧";
  if (t.includes("breakfast") || t.includes("lunch") || t.includes("dinner") || t.includes("meal") || t.includes("eat")) return "🍲";
  if (t.includes("doctor") || t.includes("appoint") || t.includes("clinic") || t.includes("nurse")) return "🩺";
  return "⭐";
}

function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.log("Audio not allowed yet", e);
  }
}

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // comfortable, clear rate for seniors
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export default function ElderlyDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newTask, setNewTask] = useState({ title: "", scheduledTime: "", category: "walk" });
  const [busyId, setBusyId] = useState(null);
  const [activeAlertTask, setActiveAlertTask] = useState(null);
  const [isEmergencySending, setIsEmergencySending] = useState(false);
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [myPhone, setMyPhone] = useState(user?.phone || "");
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyPhone || "");

  const alertedTasksRef = useRef(new Set());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [todayData, cgData, profileData] = await Promise.all([
        api.todayTasks(),
        api.myCaregivers().catch(() => ({ caregivers: [] })),
        api.getMe().catch(() => null),
      ]);
      setTasks(todayData.tasks || []);
      setCaregivers(cgData.caregivers || []);
      if (profileData?.user) {
        setMyPhone(profileData.user.phone || "");
        setEmergencyPhone(profileData.user.emergencyPhone || "");
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // 15 sec refresh
    return () => clearInterval(interval);
  }, [loadData]);

  // Check if any scheduled task is due right now
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();

    tasks.forEach((t) => {
      if (t.status === "pending") {
        const [h, m] = t.scheduled_time.split(":").map(Number);
        // If current minute matches or within 10 min window
        const diffMinutes = nowHours * 60 + nowMinutes - (h * 60 + m);
        if (diffMinutes >= 0 && diffMinutes <= 15 && !alertedTasksRef.current.has(t.id)) {
          alertedTasksRef.current.add(t.id);
          setActiveAlertTask(t);
          playChimeSound();
          speak(`Reminder: It is ${format12Hour(t.scheduled_time)}. Time for your ${t.title}! Please mark it done when finished.`);
        }
      }
    });
  }, [currentTime, tasks]);

  async function handleComplete(id, title) {
    setBusyId(id);
    setError("");
    try {
      await api.completeTask(id);
      setSuccessMsg(`Great job! "${title || "Task"}" marked as complete! 🎉`);
      if (activeAlertTask?.id === id) {
        setActiveAlertTask(null);
      }
      playChimeSound();
      speak(`Wonderful! You marked ${title || "your task"} complete.`);
      setTimeout(() => setSuccessMsg(""), 5000);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      await api.createTask({
        elderlyId: user.id,
        title: newTask.title,
        scheduledTime: newTask.scheduledTime,
        category: newTask.category,
      });
      setSuccessMsg(`Added "${newTask.title}" at ${format12Hour(newTask.scheduledTime)} to your daily schedule!`);
      setNewTask({ title: "", scheduledTime: "", category: "walk" });
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function applyPreset(preset) {
    setNewTask({
      title: preset.title,
      scheduledTime: preset.time,
      category: preset.category,
    });
  }

  async function handleDeleteTask(id, title) {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your daily schedule?`)) {
      return;
    }
    try {
      await api.deleteTask(id);
      setSuccessMsg(`Removed "${title}".`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTriggerEmergency(type = "emergency") {
    setIsEmergencySending(true);
    setError("");
    try {
      const res = await api.triggerAlert({ type });
      setSuccessMsg(
        type === "emergency"
          ? "🚨 Emergency alert dispatched to your linked caregivers!"
          : type === "test"
          ? "🧪 Test alert sent to your caregiver!"
          : "👋 Check-in sent to your caregiver!"
      );
      playChimeSound();
      speak(
        type === "emergency"
          ? "Emergency alert sent to your caregiver."
          : "Check-in alert sent."
      );
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsEmergencySending(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      await api.updateProfile({ phone: myPhone, emergencyPhone });
      setShowEditPhone(false);
      setSuccessMsg("Contact information updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function readAloudAllSchedule() {
    if (tasks.length === 0) {
      speak("You have no tasks scheduled for today.");
      return;
    }
    const pending = tasks.filter((t) => t.status === "pending");
    const completed = tasks.filter((t) => t.status === "completed");
    let msg = `Hello ${user.name}. You have ${tasks.length} total items today. ${completed.length} completed, and ${pending.length} remaining. `;
    if (pending.length > 0) {
      msg += "Your upcoming tasks are: ";
      pending.forEach((t) => {
        msg += `${t.title} at ${format12Hour(t.scheduled_time)}. `;
      });
    } else {
      msg += "All tasks for today are completed! Great work.";
    }
    speak(msg);
  }

  const primaryCaregiver = caregivers[0];
  const caregiverPhoneToCall = primaryCaregiver?.phone || emergencyPhone;

  return (
    <div className="elderly-dashboard-wrapper">
      {/* Active Time & Greeting Header */}
      <section className="senior-hero-card">
        <div className="hero-left">
          <p className="greeting-pill">
            {currentTime.getHours() < 12 ? "🌅 Good Morning" : currentTime.getHours() < 18 ? "☀️ Good Afternoon" : "🌙 Good Evening"}
          </p>
          <h1 className="senior-name-heading">{user.name}</h1>
          <p className="today-date-text">
            {currentTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="hero-right">
          <div className="big-clock-display" aria-label="Current Time">
            {currentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </div>
          <button
            type="button"
            className="btn-read-aloud"
            onClick={readAloudAllSchedule}
            title="Read today's schedule aloud"
          >
            🔊 Read Today's Schedule
          </button>
        </div>
      </section>

      {/* Messages */}
      {successMsg && <div className="alert-box alert-success senior-alert-banner">✅ {successMsg}</div>}
      {error && <div className="alert-box alert-danger senior-alert-banner">⚠️ {error}</div>}

      {/* Active Reminder Pop-up Banner */}
      {activeAlertTask && (
        <section className="active-reminder-card" aria-live="assertive">
          <div className="reminder-header">
            <span className="reminder-badge-icon">🔔 REMINDER DUE NOW</span>
            <span className="reminder-time">{format12Hour(activeAlertTask.scheduled_time)}</span>
          </div>
          <h2 className="reminder-title">
            {getTaskIcon(activeAlertTask.title, activeAlertTask.category)} {activeAlertTask.title}
          </h2>
          <p className="reminder-subtext">
            Please complete this activity now. If you don't confirm it, an alert will be sent to your caregiver.
          </p>
          <div className="reminder-actions">
            <button
              type="button"
              className="btn-huge-complete"
              disabled={busyId === activeAlertTask.id}
              onClick={() => handleComplete(activeAlertTask.id, activeAlertTask.title)}
            >
              ✅ I DID THIS / MARK COMPLETED
            </button>
            <button
              type="button"
              className="btn-snooze"
              onClick={() => {
                setActiveAlertTask(null);
                speak("Reminder dismissed. Please remember to complete your task soon.");
              }}
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* Quick Action & Caregiver Contact Row */}
      <section className="dashboard-grid-2col">
        {/* Caregiver & Emergency Card */}
        <div className="card senior-caregiver-card">
          <div className="card-header-flex">
            <h2>🩺 My Caregiver & Support</h2>
            <button
              type="button"
              className="btn-text-action"
              onClick={() => setShowEditPhone((s) => !s)}
            >
              {showEditPhone ? "Close" : "⚙️ Edit My Phone"}
            </button>
          </div>

          {showEditPhone && (
            <form onSubmit={handleSaveProfile} className="phone-edit-form">
              <label>
                My Phone Number:
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={myPhone}
                  onChange={(e) => setMyPhone(e.target.value)}
                />
              </label>
              <label>
                Caregiver / Emergency Phone Number:
                <input
                  type="tel"
                  placeholder="(555) 999-9999"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </label>
              <button type="submit" className="btn-secondary btn-sm">Save Contact Info</button>
            </form>
          )}

          {caregivers.length > 0 ? (
            <div className="caregiver-info-box">
              {caregivers.map((cg) => (
                <div key={cg.id} className="caregiver-row">
                  <div className="caregiver-avatar">🧑‍⚕️</div>
                  <div className="caregiver-meta">
                    <strong>{cg.name}</strong>
                    <span>{cg.email}</span>
                    {cg.phone ? (
                      <span className="phone-tag">📞 {cg.phone}</span>
                    ) : (
                      <span className="phone-tag-empty">No phone listed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-caregiver-box">
              <p>No caregiver has linked to your account yet.</p>
              <p className="invite-reminder">
                Give your invite code to your caregiver:{" "}
                <span className="large-code-pill">{user.inviteCode}</span>
              </p>
            </div>
          )}

          {/* Direct Calling & Emergency Buttons */}
          <div className="caregiver-action-buttons">
            {caregiverPhoneToCall ? (
              <a href={`tel:${caregiverPhoneToCall}`} className="btn-call-caregiver">
                📞 Call Caregiver ({caregiverPhoneToCall})
              </a>
            ) : (
              <button
                type="button"
                className="btn-call-caregiver disabled"
                onClick={() => setShowEditPhone(true)}
              >
                📞 Add Caregiver Phone Number
              </button>
            )}

            <button
              type="button"
              className="btn-emergency-sos"
              disabled={isEmergencySending}
              onClick={() => handleTriggerEmergency("emergency")}
              title="Instantly alert linked caregivers that you need immediate help"
            >
              🚨 {isEmergencySending ? "Sending Alert..." : "Emergency Help Alert to Caregiver"}
            </button>
          </div>

          <div className="test-alert-row">
            <button
              type="button"
              className="btn-checkin"
              onClick={() => handleTriggerEmergency("checkin")}
            >
              👋 Send "I'm OK" Check-in
            </button>
            <button
              type="button"
              className="btn-test-alert"
              onClick={() => handleTriggerEmergency("test")}
            >
              🧪 Test Alert (Demo)
            </button>
          </div>
        </div>

        {/* Share Invite Code Card */}
        <div className="card senior-invite-card">
          <h2>🔑 Caregiver Connection Code</h2>
          <p className="invite-desc">
            Share this code with your family member, nurse, or caregiver so they can monitor your schedule and receive automatic alerts if you miss an item.
          </p>
          <div className="giant-code-display" title="Your unique invite code">
            {user.inviteCode}
          </div>
          <button
            type="button"
            className="btn-copy-code"
            onClick={() => {
              navigator.clipboard.writeText(user.inviteCode);
              setSuccessMsg("Invite code copied to clipboard!");
              setTimeout(() => setSuccessMsg(""), 3000);
            }}
          >
            📋 Copy Code
          </button>
          <p className="invite-help-text">
            Caregivers can enter this on their EverClear-Care app to connect instantly.
          </p>
        </div>
      </section>

      {/* Today's Schedule List Section */}
      <section className="card schedule-main-card">
        <div className="schedule-header-row">
          <div>
            <h2>📋 Today's Schedule & Routine</h2>
            <p className="schedule-subtext">
              Tap "I Did This" as you complete each task throughout the day.
            </p>
          </div>
          <div className="schedule-stats-pills">
            <span className="stat-pill total">{tasks.length} Total</span>
            <span className="stat-pill completed">
              {tasks.filter((t) => t.status === "completed").length} Done
            </span>
            <span className="stat-pill pending">
              {tasks.filter((t) => t.status === "pending").length} Remaining
            </span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-schedule-state">
            <span className="empty-icon">🗓️</span>
            <h3>No tasks scheduled for today yet</h3>
            <p>Use the presets below or add your own daily routine items like walks, meals, and medication!</p>
          </div>
        ) : (
          <div className="senior-task-grid">
            {tasks.map((task) => {
              const icon = getTaskIcon(task.title, task.category);
              const isCompleted = task.status === "completed";
              const isMissed = task.status === "missed";

              return (
                <div
                  key={task.id}
                  className={`senior-task-card status-${task.status}`}
                  aria-label={`${task.title} at ${format12Hour(task.scheduled_time)}`}
                >
                  <div className="task-card-left">
                    <span className="task-icon-bubble">{icon}</span>
                    <div className="task-text-group">
                      <div className="task-time-badge">{format12Hour(task.scheduled_time)}</div>
                      <h3 className="task-card-title">{task.title}</h3>
                      <div className="task-status-indicator">
                        {isCompleted && <span className="tag-completed">✅ Completed</span>}
                        {isMissed && <span className="tag-missed">⚠️ Missed / Alert Sent</span>}
                        {!isCompleted && !isMissed && <span className="tag-pending">⏳ Scheduled</span>}
                      </div>
                    </div>
                  </div>

                  <div className="task-card-right">
                    {!isCompleted ? (
                      <button
                        type="button"
                        className="btn-mark-done-large"
                        disabled={busyId === task.id}
                        onClick={() => handleComplete(task.id, task.title)}
                      >
                        {busyId === task.id ? "Saving..." : "✅ I Did This!"}
                      </button>
                    ) : (
                      <div className="completed-check-label">
                        <span>Done at {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Today"}</span>
                      </div>
                    )}

                    <div className="task-card-subactions">
                      <button
                        type="button"
                        className="btn-card-audio"
                        onClick={() => speak(`${task.title} scheduled for ${format12Hour(task.scheduled_time)}. Status is ${task.status}.`)}
                        title="Read this task aloud"
                      >
                        🔊 Listen
                      </button>
                      <button
                        type="button"
                        className="btn-card-delete"
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        title="Delete this task"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Task / Schedule Management Section */}
      <section className="card add-task-card">
        <h2>➕ Add to Daily Schedule</h2>
        <p className="add-task-desc">
          Choose a quick preset or create a custom scheduled activity (e.g. morning walk, blood pressure check, medication).
        </p>

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="presets-label">⚡ Quick Presets:</span>
          <div className="preset-buttons-wrap">
            {PRESET_TASKS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-preset-chip"
                onClick={() => applyPreset(preset)}
              >
                <span>{preset.icon}</span>
                <strong>{preset.title}</strong>
                <small>({format12Hour(preset.time)})</small>
              </button>
            ))}
          </div>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="add-task-form">
          <div className="form-group-flex">
            <label className="form-label-flex">
              Activity Name:
              <input
                type="text"
                placeholder="e.g. Morning walk in the park"
                value={newTask.title}
                onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                required
              />
            </label>

            <label className="form-label-flex">
              Scheduled Time:
              <input
                type="time"
                value={newTask.scheduledTime}
                onChange={(e) => setNewTask((t) => ({ ...t, scheduledTime: e.target.value }))}
                required
              />
            </label>

            <label className="form-label-flex">
              Category:
              <select
                value={newTask.category}
                onChange={(e) => setNewTask((t) => ({ ...t, category: e.target.value }))}
              >
                <option value="walk">🚶 Walk / Exercise</option>
                <option value="medication">💊 Medication / Pills</option>
                <option value="meal">🍲 Meal / Food</option>
                <option value="hydration">💧 Hydration / Water</option>
                <option value="doctor">🩺 Doctor / Health</option>
                <option value="general">⭐ General Routine</option>
              </select>
            </label>
          </div>

          <button type="submit" className="btn-primary btn-add-submit">
            ➕ Add Activity to Schedule
          </button>
        </form>
      </section>
    </div>
  );
}
