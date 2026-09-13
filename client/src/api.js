const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
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
