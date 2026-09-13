const path = require("path");
const fs = require("fs");

const dbPath = process.env.DB_PATH || "./data/care.json";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let state = {
  users: [],
  links: [],
  tasks: [],
  task_logs: [],
  alerts: [],
  _counters: { users: 0, links: 0, tasks: 0, task_logs: 0, alerts: 0 },
};

function save() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving DB:", err);
  }
}

function load() {
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, "utf8");
      state = JSON.parse(raw);
    } catch (e) {
      console.error("Error loading JSON database, using fresh store:", e);
    }
  }
}

load();

function normalize(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

const db = {
  exec(sql) {},
  pragma() {},
  prepare(sql) {
    const s = normalize(sql);

    return {
      run(...args) {
        // INSERT INTO users
        if (s.startsWith("INSERT INTO users")) {
          const [name, email, password_hash, role, invite_code, phone, emergency_phone] = args;
          state._counters.users = (state._counters.users || 0) + 1;
          const user = {
            id: state._counters.users,
            name,
            email,
            password_hash,
            role,
            invite_code: invite_code || null,
            phone: phone || null,
            emergency_phone: emergency_phone || null,
            created_at: new Date().toISOString(),
          };
          state.users.push(user);
          save();
          return { lastInsertRowid: user.id, changes: 1 };
        }

        // UPDATE users
        if (s.startsWith("UPDATE users SET name = ?, phone = ?, emergency_phone = ? WHERE id = ?")) {
          const [name, phone, emergency_phone, id] = args;
          const user = state.users.find((u) => u.id === Number(id));
          if (user) {
            user.name = name;
            user.phone = phone || null;
            user.emergency_phone = emergency_phone || null;
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // INSERT INTO links
        if (s.startsWith("INSERT INTO links")) {
          const [caregiver_id, elderly_id] = args;
          state._counters.links = (state._counters.links || 0) + 1;
          const link = {
            id: state._counters.links,
            caregiver_id: Number(caregiver_id),
            elderly_id: Number(elderly_id),
            created_at: new Date().toISOString(),
          };
          state.links.push(link);
          save();
          return { lastInsertRowid: link.id, changes: 1 };
        }

        // INSERT INTO tasks
        if (s.startsWith("INSERT INTO tasks")) {
          const [elderly_id, created_by, title, scheduled_time, days_of_week, category] = args;
          state._counters.tasks = (state._counters.tasks || 0) + 1;
          const task = {
            id: state._counters.tasks,
            elderly_id: Number(elderly_id),
            created_by: Number(created_by),
            title,
            scheduled_time,
            days_of_week: days_of_week || "0,1,2,3,4,5,6",
            category: category || "general",
            active: 1,
            created_at: new Date().toISOString(),
          };
          state.tasks.push(task);
          save();
          return { lastInsertRowid: task.id, changes: 1 };
        }

        // UPDATE tasks SET active = 0 WHERE id = ?
        if (s.includes("UPDATE tasks SET active = 0 WHERE id = ?")) {
          const id = Number(args[0]);
          const task = state.tasks.find((t) => t.id === id);
          if (task) {
            task.active = 0;
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // INSERT OR IGNORE INTO task_logs
        if (s.startsWith("INSERT OR IGNORE INTO task_logs")) {
          const [task_id, due_date] = args;
          const existing = state.task_logs.find(
            (l) => l.task_id === Number(task_id) && l.due_date === due_date
          );
          if (!existing) {
            state._counters.task_logs = (state._counters.task_logs || 0) + 1;
            state.task_logs.push({
              id: state._counters.task_logs,
              task_id: Number(task_id),
              due_date,
              status: "pending",
              completed_at: null,
              alerted: 0,
            });
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // UPDATE task_logs SET status = 'completed'
        if (s.includes("UPDATE task_logs SET status = 'completed'")) {
          const [task_id, due_date] = args;
          const log = state.task_logs.find(
            (l) => l.task_id === Number(task_id) && l.due_date === due_date
          );
          if (log) {
            log.status = "completed";
            log.completed_at = new Date().toISOString();
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // UPDATE task_logs SET status = 'missed' WHERE id = ?
        if (s.includes("UPDATE task_logs SET status = 'missed' WHERE id = ?")) {
          const id = Number(args[0]);
          const log = state.task_logs.find((l) => l.id === id);
          if (log) {
            log.status = "missed";
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // UPDATE task_logs SET alerted = 1 WHERE id = ?
        if (s.includes("UPDATE task_logs SET alerted = 1 WHERE id = ?")) {
          const id = Number(args[0]);
          const log = state.task_logs.find((l) => l.id === id);
          if (log) {
            log.alerted = 1;
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // INSERT INTO alerts
        if (s.startsWith("INSERT INTO alerts")) {
          const [caregiver_id, elderly_id, task_id, message, alert_type] = args;
          state._counters.alerts = (state._counters.alerts || 0) + 1;
          const alert = {
            id: state._counters.alerts,
            caregiver_id: Number(caregiver_id),
            elderly_id: Number(elderly_id),
            task_id: task_id ? Number(task_id) : null,
            message,
            alert_type: alert_type || "missed_task",
            is_read: 0,
            created_at: new Date().toISOString(),
          };
          state.alerts.push(alert);
          save();
          return { lastInsertRowid: alert.id, changes: 1 };
        }

        // UPDATE alerts SET is_read = 1 WHERE id = ? AND caregiver_id = ?
        if (s.includes("UPDATE alerts SET is_read = 1 WHERE id = ? AND caregiver_id = ?")) {
          const [id, cg_id] = args;
          const alert = state.alerts.find(
            (a) => a.id === Number(id) && a.caregiver_id === Number(cg_id)
          );
          if (alert) {
            alert.is_read = 1;
            save();
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // UPDATE alerts SET is_read = 1 WHERE caregiver_id = ?
        if (s.includes("UPDATE alerts SET is_read = 1 WHERE caregiver_id = ?")) {
          const cg_id = Number(args[0]);
          let cnt = 0;
          state.alerts.forEach((a) => {
            if (a.caregiver_id === cg_id) {
              a.is_read = 1;
              cnt++;
            }
          });
          save();
          return { changes: cnt };
        }

        return { changes: 0 };
      },

      get(...args) {
        // SELECT * FROM users WHERE email = ?
        if (s.includes("FROM users WHERE email = ?")) {
          const email = String(args[0]).toLowerCase();
          return state.users.find((u) => u.email.toLowerCase() === email) || null;
        }

        // SELECT * FROM users WHERE id = ?
        if (s.includes("FROM users WHERE id = ?")) {
          const id = Number(args[0]);
          return state.users.find((u) => u.id === id) || null;
        }

        // SELECT id FROM users WHERE invite_code = ?
        if (s.includes("FROM users WHERE invite_code = ?")) {
          const code = String(args[0]).trim();
          return state.users.find((u) => u.invite_code === code && u.role === "elderly") || null;
        }

        // SELECT id FROM links WHERE caregiver_id = ? AND elderly_id = ?
        if (s.includes("FROM links WHERE caregiver_id = ? AND elderly_id = ?")) {
          const [cg, el] = args;
          return state.links.find((l) => l.caregiver_id === Number(cg) && l.elderly_id === Number(el)) || null;
        }

        // SELECT * FROM tasks WHERE id = ? AND elderly_id = ?
        if (s.includes("FROM tasks WHERE id = ? AND elderly_id = ?")) {
          const [id, el] = args;
          return state.tasks.find((t) => t.id === Number(id) && t.elderly_id === Number(el)) || null;
        }

        // SELECT * FROM tasks WHERE id = ?
        if (s.includes("FROM tasks WHERE id = ?")) {
          const id = Number(args[0]);
          return state.tasks.find((t) => t.id === id) || null;
        }

        // SELECT * FROM task_logs WHERE task_id = ? AND due_date = ?
        if (s.includes("FROM task_logs WHERE task_id = ? AND due_date = ?")) {
          const [task_id, due_date] = args;
          return state.task_logs.find((l) => l.task_id === Number(task_id) && l.due_date === due_date) || null;
        }

        return null;
      },

      all(...args) {
        // SELECT * FROM tasks WHERE active = 1
        if (s.startsWith("SELECT * FROM tasks WHERE active = 1")) {
          return state.tasks.filter((t) => t.active === 1);
        }

        // SELECT * FROM tasks WHERE elderly_id = ? AND active = 1
        if (s.includes("FROM tasks WHERE elderly_id = ? AND active = 1")) {
          const elderly_id = Number(args[0]);
          const tasks = state.tasks.filter((t) => t.elderly_id === elderly_id && t.active === 1);
          tasks.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
          return tasks;
        }

        // SELECT caregiver_id FROM links WHERE elderly_id = ?
        if (s.includes("SELECT caregiver_id FROM links WHERE elderly_id = ?")) {
          const elderly_id = Number(args[0]);
          return state.links
            .filter((l) => l.elderly_id === elderly_id)
            .map((l) => ({ caregiver_id: l.caregiver_id }));
        }

        // Caregiver linked elderly list
        if (s.includes("JOIN users u ON u.id = l.elderly_id") && s.includes("WHERE l.caregiver_id = ?")) {
          const cg_id = Number(args[0]);
          const linkedIds = state.links.filter((l) => l.caregiver_id === cg_id).map((l) => l.elderly_id);
          return state.users
            .filter((u) => linkedIds.includes(u.id))
            .map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              emergencyPhone: u.emergency_phone,
            }));
        }

        // Elderly user checking their linked caregivers
        if (s.includes("JOIN users u ON u.id = l.caregiver_id") && s.includes("WHERE l.elderly_id = ?")) {
          const el_id = Number(args[0]);
          const cgIds = state.links.filter((l) => l.elderly_id === el_id).map((l) => l.caregiver_id);
          return state.users
            .filter((u) => cgIds.includes(u.id))
            .map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
            }));
        }

        // Caregiver alerts feed
        if (s.includes("FROM alerts a") && s.includes("WHERE a.caregiver_id = ?")) {
          const cg_id = Number(args[0]);
          const alerts = state.alerts
            .filter((a) => a.caregiver_id === cg_id)
            .map((a) => {
              const elderly = state.users.find((u) => u.id === a.elderly_id) || {};
              const task = a.task_id ? state.tasks.find((t) => t.id === a.task_id) : null;
              return {
                id: a.id,
                message: a.message,
                alert_type: a.alert_type,
                is_read: a.is_read,
                created_at: a.created_at,
                elderly_id: a.elderly_id,
                elderly_name: elderly.name || "Senior",
                elderly_phone: elderly.phone || null,
                elderly_emergency_phone: elderly.emergency_phone || null,
                task_title: task ? task.title : null,
                task_time: task ? task.scheduled_time : null,
              };
            });
          alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return alerts;
        }

        return [];
      },
    };
  },
};

module.exports = db;
