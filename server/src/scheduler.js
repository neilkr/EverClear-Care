const cron = require("node-cron");
const db = require("./db");
const { todayISO, isDueToday, ensureLogForToday } = require("./scheduleUtils");

// Runs every minute: finds tasks due today whose grace period has elapsed and are still
// not marked completed, marks them missed, and creates one alert per caregiver linked to that person.
function checkMissedTasks() {
  const graceMinutes = Number(process.env.GRACE_PERIOD_MINUTES || 30);
  const now = new Date();
  const date = todayISO(now);

  const tasks = db.prepare("SELECT * FROM tasks WHERE active = 1").all().filter((t) => isDueToday(t, date));

  for (const task of tasks) {
    const log = ensureLogForToday(task, date);
    if (log.status !== "pending") continue;

    const [h, m] = task.scheduled_time.split(":").map(Number);
    const dueAt = new Date(now);
    dueAt.setHours(h, m, 0, 0);
    const graceDeadline = new Date(dueAt.getTime() + graceMinutes * 60 * 1000);

    if (now < graceDeadline) continue; // still within grace period

    db.prepare("UPDATE task_logs SET status = 'missed' WHERE id = ?").run(log.id);

    if (log.alerted) continue;
    db.prepare("UPDATE task_logs SET alerted = 1 WHERE id = ?").run(log.id);

    const caregivers = db
      .prepare("SELECT caregiver_id FROM links WHERE elderly_id = ?")
      .all(task.elderly_id);
    const elderly = db.prepare("SELECT name, phone FROM users WHERE id = ?").get(task.elderly_id);

    const contactPart = elderly.phone ? ` (Phone: ${elderly.phone})` : "";
    const message = `⚠️ Schedule Missed: ${elderly.name}${contactPart} did not confirm "${task.title}" (due at ${task.scheduled_time}).`;
    const insertAlert = db.prepare(
      "INSERT INTO alerts (caregiver_id, elderly_id, task_id, message, alert_type) VALUES (?, ?, ?, ?, 'missed_task')"
    );
    for (const c of caregivers) {
      insertAlert.run(c.caregiver_id, task.elderly_id, task.id, message);
    }
  }
}

function startScheduler() {
  // Run once at startup, then every minute
  checkMissedTasks();
  cron.schedule("* * * * *", checkMissedTasks);
}

module.exports = { startScheduler, checkMissedTasks };
