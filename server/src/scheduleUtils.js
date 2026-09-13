const db = require("./db");

function todayISO(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function isDueToday(task, dateISO = todayISO()) {
  const dow = new Date(`${dateISO}T00:00:00`).getDay();
  return task.days_of_week.split(",").map(Number).includes(dow);
}

// Creates today's pending log row for a task if it doesn't already exist, returns the row
function ensureLogForToday(task, dateISO = todayISO()) {
  db.prepare(
    "INSERT OR IGNORE INTO task_logs (task_id, due_date, status) VALUES (?, ?, 'pending')"
  ).run(task.id, dateISO);
  return db.prepare("SELECT * FROM task_logs WHERE task_id = ? AND due_date = ?").get(task.id, dateISO);
}

module.exports = { todayISO, isDueToday, ensureLogForToday };
