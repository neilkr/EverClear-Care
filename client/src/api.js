const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("token");
}

// ============================================================================
// BROWSER DEMO / LOCALSTORAGE FALLBACK ENGINE
// Ensures full functionality even on GitHub Pages or if backend is offline
// ============================================================================
function initDemoStorage() {
  if (!localStorage.getItem("sc_users")) {
    const defaultUsers = [
      {
        id: 1,
        name: "Grandma Eleanor",
        email: "senior@demo.com",
        password: "password123",
        role: "elderly",
        inviteCode: "DEMO6520",
        phone: "(555) 234-5678",
        emergencyPhone: "(555) 987-6543",
      },
      {
        id: 2,
        name: "Caregiver Alex",
        email: "caregiver@demo.com",
        password: "password123",
        role: "caregiver",
        inviteCode: null,
        phone: "(555) 987-6543",
        emergencyPhone: null,
      },
    ];
    localStorage.setItem("sc_users", JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem("sc_links")) {
    const defaultLinks = [
      { id: 1, caregiverId: 2, elderlyId: 1 },
    ];
    localStorage.setItem("sc_links", JSON.stringify(defaultLinks));
  }

  if (!localStorage.getItem("sc_tasks")) {
    const defaultTasks = [
      { id: 1, elderlyId: 1, title: "Morning Walk in the Park", scheduled_time: "08:00", category: "walk", days_of_week: "0,1,2,3,4,5,6", active: 1, status: "completed", completedAt: new Date().toISOString() },
      { id: 2, elderlyId: 1, title: "Morning Blood Pressure Medication", scheduled_time: "09:00", category: "medication", days_of_week: "0,1,2,3,4,5,6", active: 1, status: "pending", completedAt: null },
      { id: 3, elderlyId: 1, title: "Healthy Lunch & Hydration", scheduled_time: "12:30", category: "meal", days_of_week: "0,1,2,3,4,5,6", active: 1, status: "pending", completedAt: null },
      { id: 4, elderlyId: 1, title: "Afternoon Walk & Fresh Air", scheduled_time: "17:30", category: "walk", days_of_week: "0,1,2,3,4,5,6", active: 1, status: "pending", completedAt: null },
      { id: 5, elderlyId: 1, title: "Evening Medication & Rest", scheduled_time: "20:30", category: "medication", days_of_week: "0,1,2,3,4,5,6", active: 1, status: "pending", completedAt: null },
    ];
    localStorage.setItem("sc_tasks", JSON.stringify(defaultTasks));
  }

  if (!localStorage.getItem("sc_alerts")) {
    const defaultAlerts = [
      {
        id: 1,
        caregiver_id: 2,
        elderly_id: 1,
        elderly_name: "Grandma Eleanor",
        elderly_phone: "(555) 234-5678",
        message: "👋 Check-in from Grandma Eleanor: \"I am checking in to let you know everything is okay.\"",
        alert_type: "checkin",
        is_read: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: 2,
        caregiver_id: 2,
        elderly_id: 1,
        elderly_name: "Grandma Eleanor",
        elderly_phone: "(555) 234-5678",
        message: "⚠️ Schedule Missed: Grandma Eleanor (Phone: (555) 234-5678) did not confirm \"Morning Walk in the Park\" (due at 08:00).",
        alert_type: "missed_task",
        is_read: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ];
    localStorage.setItem("sc_alerts", JSON.stringify(defaultAlerts));
  }
}

initDemoStorage();

function getLocalUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function handleMockRequest(path, method, body) {
  initDemoStorage();
  const users = JSON.parse(localStorage.getItem("sc_users") || "[]");
  const links = JSON.parse(localStorage.getItem("sc_links") || "[]");
  const tasks = JSON.parse(localStorage.getItem("sc_tasks") || "[]");
  const alerts = JSON.parse(localStorage.getItem("sc_alerts") || "[]");
  const curUser = getLocalUser();

  // /auth/register
  if (path === "/auth/register" && method === "POST") {
    const { name, email, password, role, phone, emergencyPhone } = body || {};
    const normEmail = (email || "").trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === normEmail);
    if (existing) {
      throw new Error("An account with this email already exists");
    }
    const newId = (users.length > 0 ? Math.max(...users.map((u) => u.id)) : 0) + 1;
    const inviteCode = role === "elderly" ? "SC" + Math.random().toString(36).substring(2, 8).toUpperCase() : null;
    const newUser = {
      id: newId,
      name: name || "User",
      email: normEmail,
      password: password || "password123",
      role: role || "elderly",
      inviteCode,
      phone: phone || null,
      emergencyPhone: emergencyPhone || null,
    };
    users.push(newUser);
    localStorage.setItem("sc_users", JSON.stringify(users));

    const token = "mock-jwt-" + newId + "-" + Date.now();
    return { token, user: newUser };
  }

  // /auth/login
  if (path === "/auth/login" && method === "POST") {
    const { email, password } = body || {};
    const normEmail = (email || "").trim().toLowerCase();
    let user = users.find((u) => u.email.toLowerCase() === normEmail);

    if (!user) {
      // Auto-register for smooth testing if user types a new email
      const newId = (users.length > 0 ? Math.max(...users.map((u) => u.id)) : 0) + 1;
      const role = normEmail.includes("care") ? "caregiver" : "elderly";
      const name = normEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
      const inviteCode = role === "elderly" ? "SC" + Math.random().toString(36).substring(2, 8).toUpperCase() : null;
      user = {
        id: newId,
        name: name.charAt(0).toUpperCase() + name.slice(1) || "User",
        email: normEmail,
        password: password || "password123",
        role,
        inviteCode,
        phone: "(555) 234-5678",
        emergencyPhone: "(555) 987-6543",
      };
      users.push(user);
      localStorage.setItem("sc_users", JSON.stringify(users));
    } else if (user.password && password && user.password !== password) {
      // Accept password or update
      user.password = password;
      localStorage.setItem("sc_users", JSON.stringify(users));
    }

    const token = "mock-jwt-" + user.id + "-" + Date.now();
    return { token, user };
  }

  // /auth/me
  if (path === "/auth/me") {
    if (!curUser) throw new Error("Not authenticated");
    const fresh = users.find((u) => u.id === curUser.id) || curUser;
    return { user: fresh };
  }

  // /auth/profile
  if (path === "/auth/profile" && method === "PUT") {
    if (!curUser) throw new Error("Not authenticated");
    const idx = users.findIndex((u) => u.id === curUser.id);
    if (idx !== -1) {
      if (body.name) users[idx].name = body.name;
      if (body.phone !== undefined) users[idx].phone = body.phone;
      if (body.emergencyPhone !== undefined) users[idx].emergencyPhone = body.emergencyPhone;
      localStorage.setItem("sc_users", JSON.stringify(users));
      return { user: users[idx] };
    }
    return { user: curUser };
  }

  // /tasks/today
  if (path === "/tasks/today") {
    if (!curUser) return { date: new Date().toISOString().slice(0, 10), tasks: [] };
    const myTasks = tasks.filter((t) => t.elderlyId === curUser.id && t.active !== 0);
    myTasks.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));
    return { date: new Date().toISOString().slice(0, 10), tasks: myTasks };
  }

  // /tasks/:id/complete
  if (path.match(/\/tasks\/\d+\/complete/) && method === "POST") {
    const id = Number(path.split("/")[2]);
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.status = "completed";
      task.completedAt = new Date().toISOString();
      localStorage.setItem("sc_tasks", JSON.stringify(tasks));
    }
    return { ok: true };
  }

  // /tasks (POST create)
  if (path === "/tasks" && method === "POST") {
    const { elderlyId, title, scheduledTime, category } = body || {};
    const newId = (tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) : 0) + 1;
    const newTask = {
      id: newId,
      elderlyId: Number(elderlyId || curUser?.id || 1),
      title: title || "Routine Task",
      scheduled_time: scheduledTime || "10:00",
      category: category || "general",
      days_of_week: "0,1,2,3,4,5,6",
      active: 1,
      status: "pending",
      completedAt: null,
    };
    tasks.push(newTask);
    localStorage.setItem("sc_tasks", JSON.stringify(tasks));
    return { id: newId };
  }

  // /tasks/:id (DELETE)
  if (path.startsWith("/tasks/") && method === "DELETE") {
    const id = Number(path.split("/")[2]);
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.active = 0;
      localStorage.setItem("sc_tasks", JSON.stringify(tasks));
    }
    return { ok: true };
  }

  // /tasks/elderly/:elderlyId
  if (path.startsWith("/tasks/elderly/")) {
    const elderlyId = Number(path.split("/")[3]);
    const tList = tasks.filter((t) => t.elderlyId === elderlyId && t.active !== 0);
    tList.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));
    return { tasks: tList };
  }

  // /caregiver/link
  if (path === "/caregiver/link" && method === "POST") {
    const { inviteCode } = body || {};
    const code = (inviteCode || "").trim().toUpperCase();
    const elderly = users.find((u) => u.inviteCode && u.inviteCode.toUpperCase() === code);
    if (!elderly) throw new Error("Invite code not found. Please verify the code.");

    const exists = links.find((l) => l.caregiverId === curUser?.id && l.elderlyId === elderly.id);
    if (!exists && curUser) {
      links.push({ id: links.length + 1, caregiverId: curUser.id, elderlyId: elderly.id });
      localStorage.setItem("sc_links", JSON.stringify(links));
    }
    return { linked: elderly };
  }

  // /caregiver/linked
  if (path === "/caregiver/linked") {
    if (!curUser) return { elderly: [] };
    const myLinks = links.filter((l) => l.caregiverId === curUser.id);
    const linkedUsers = users.filter((u) => myLinks.some((l) => l.elderlyId === u.id));

    // Attach summary stats
    const enhanced = linkedUsers.map((p) => {
      const pTasks = tasks.filter((t) => t.elderlyId === p.id && t.active !== 0);
      const completed = pTasks.filter((t) => t.status === "completed").length;
      const missed = pTasks.filter((t) => t.status === "missed").length;
      const pending = pTasks.filter((t) => t.status === "pending").length;
      return {
        ...p,
        todaySummary: { total: pTasks.length, completed, pending, missed },
      };
    });
    return { elderly: enhanced };
  }

  // /caregiver/linked/:id/today
  if (path.startsWith("/caregiver/linked/") && path.endsWith("/today")) {
    const parts = path.split("/");
    const elderlyId = Number(parts[3]);
    const pTasks = tasks.filter((t) => t.elderlyId === elderlyId && t.active !== 0);
    pTasks.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));
    return { date: new Date().toISOString().slice(0, 10), tasks: pTasks };
  }

  // /caregiver/my-caregivers
  if (path === "/caregiver/my-caregivers") {
    if (!curUser) return { caregivers: [] };
    const myLinks = links.filter((l) => l.elderlyId === curUser.id);
    const cgList = users.filter((u) => myLinks.some((l) => l.caregiverId === u.id));
    return { caregivers: cgList };
  }

  // /caregiver/trigger-alert
  if (path === "/caregiver/trigger-alert" && method === "POST") {
    if (!curUser) throw new Error("Not logged in");
    const { type, customMessage } = body || {};
    const myLinks = links.filter((l) => l.elderlyId === curUser.id);
    const targetCaregivers = myLinks.length > 0 ? myLinks.map((l) => l.caregiverId) : [2];

    let messagePrefix = "";
    if (type === "emergency") {
      messagePrefix = `🚨 URGENT: ${curUser.name} requested immediate assistance / help!`;
    } else if (type === "checkin") {
      messagePrefix = `👋 Check-in from ${curUser.name}: "I am checking in to let you know everything is okay."`;
    } else {
      messagePrefix = `🧪 [TEST ALERT] ${curUser.name} sent a test alert from the Senior Schedule app.`;
    }

    const finalMessage = customMessage ? `${messagePrefix} Note: ${customMessage}` : messagePrefix;

    targetCaregivers.forEach((cgId) => {
      alerts.unshift({
        id: (alerts.length > 0 ? Math.max(...alerts.map((a) => a.id)) : 0) + 1,
        caregiver_id: cgId,
        elderly_id: curUser.id,
        elderly_name: curUser.name,
        elderly_phone: curUser.phone || "(555) 234-5678",
        message: finalMessage,
        alert_type: type || "emergency",
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    });

    localStorage.setItem("sc_alerts", JSON.stringify(alerts));
    return { ok: true, sentCount: targetCaregivers.length, message: finalMessage };
  }

  // /caregiver/alerts
  if (path === "/caregiver/alerts") {
    if (!curUser) return { alerts: [] };
    const myAlerts = alerts.filter((a) => a.caregiver_id === curUser.id || curUser.role === "caregiver");
    myAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { alerts: myAlerts };
  }

  // /caregiver/alerts/:id/read
  if (path.match(/\/caregiver\/alerts\/\d+\/read/) && method === "POST") {
    const id = Number(path.split("/")[3]);
    const al = alerts.find((a) => a.id === id);
    if (al) {
      al.is_read = 1;
      localStorage.setItem("sc_alerts", JSON.stringify(alerts));
    }
    return { ok: true };
  }

  // /caregiver/alerts/read-all
  if (path === "/caregiver/alerts/read-all" && method === "POST") {
    alerts.forEach((a) => {
      a.is_read = 1;
    });
    localStorage.setItem("sc_alerts", JSON.stringify(alerts));
    return { ok: true };
  }

  return { ok: true };
}

async function request(path, { method = "GET", body } = {}) {
  // If we are on GitHub Pages or custom frontend static host with no backend URL configured
  const isStaticSite = window.location.hostname.includes("github.io");

  if (!isStaticSite) {
    try {
      const headers = { "Content-Type": "application/json" };
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        return await res.json();
      }

      const errData = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404 || res.status === 409) {
        throw new Error(errData.error || "Request failed");
      }
    } catch (err) {
      // If it's a validation/auth error from server, rethrow
      if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
      console.warn("Backend server not responding. Falling back to local browser storage mode.", err);
    }
  }

  // Fallback to local storage demo mode
  return handleMockRequest(path, method, body);
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  getMe: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PUT", body: payload }),
  todayTasks: () => request("/tasks/today"),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: "POST" }),
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  elderlyTasks: (elderlyId) => request(`/tasks/elderly/${elderlyId}`),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  linkElderly: (inviteCode) => request("/caregiver/link", { method: "POST", body: { inviteCode } }),
  linkedElderly: () => request("/caregiver/linked"),
  elderlyTodayTasks: (elderlyId) => request(`/caregiver/linked/${elderlyId}/today`),
  myCaregivers: () => request("/caregiver/my-caregivers"),
  triggerAlert: (payload) => request("/caregiver/trigger-alert", { method: "POST", body: payload }),
  alerts: () => request("/caregiver/alerts"),
  markAlertRead: (id) => request(`/caregiver/alerts/${id}/read`, { method: "POST" }),
  markAllAlertsRead: () => request("/caregiver/alerts/read-all", { method: "POST" }),
};

export { getToken };
