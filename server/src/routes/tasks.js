const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { todayISO, isDueToday, ensureLogForToday } = require("../scheduleUtils");

const router = express.Router();
router.use(authRequired);

// Ownership check: caller must be the elderly user themselves, or a caregiver linked to them
function canManage(userId, role, elderlyId) {
  if (role === "elderly") return userId === elderlyId;
  const link = db
    .prepare("SELECT id FROM links WHERE caregiver_id = ? AND elderly_id = ?")
    .get(userId, elderlyId);
  return !!link;
}

router.post(
  "/",
  [
    body("elderlyId").isInt({ min: 1 }),
    body("title").trim().isLength({ min: 1, max: 200 }).escape(),
    body("scheduledTime").matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body("daysOfWeek")
      .optional()
      .matches(/^[0-6](,[0-6]){0,6}$/),
    body("category").optional().trim().isIn(["walk", "medication", "meal", "hydration", "doctor", "general"]),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input", details: errors.array() });

    const elderlyId = Number(req.body.elderlyId);
    if (!canManage(req.user.id, req.user.role, elderlyId)) {
      return res.status(403).json({ error: "Not authorized for this person" });
    }

    const elderly = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'elderly'").get(elderlyId);
    if (!elderly) return res.status(404).json({ error: "Elderly user not found" });

    const daysOfWeek = req.body.daysOfWeek || "0,1,2,3,4,5,6";
    const category = req.body.category || "general";

    const result = db
      .prepare(
        "INSERT INTO tasks (elderly_id, created_by, title, scheduled_time, days_of_week, category) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(elderlyId, req.user.id, req.body.title, req.body.scheduledTime, daysOfWeek, category);

    res.status(201).json({ id: result.lastInsertRowid });
  }
);

// List all tasks for an elderly user (accessible by that elderly user or a linked caregiver)
router.get("/elderly/:elderlyId", (req, res) => {
  const elderlyId = Number(req.params.elderlyId);
  if (!Number.isInteger(elderlyId)) return res.status(400).json({ error: "Invalid id" });
  if (!canManage(req.user.id, req.user.role, elderlyId)) {
    return res.status(403).json({ error: "Not authorized for this person" });
  }

  const tasks = db
    .prepare("SELECT * FROM tasks WHERE elderly_id = ? AND active = 1 ORDER BY scheduled_time")
    .all(elderlyId);

  res.json({ tasks });
});

// Today's tasks + status for the logged-in elderly user
router.get("/today", (req, res) => {
  if (req.user.role !== "elderly") {
    return res.status(403).json({ error: "Only elderly users have a personal schedule view" });
  }

  const date = todayISO();
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE elderly_id = ? AND active = 1")
    .all(req.user.id)
    .filter((t) => isDueToday(t, date));

  const withStatus = tasks.map((t) => {
    const log = ensureLogForToday(t, date);
    return { ...t, status: log.status, completedAt: log.completed_at };
  });

  withStatus.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
  res.json({ date, tasks: withStatus });
});

// Elderly user marks today's occurrence of a task as done
router.post("/:id/complete", (req, res) => {
  if (req.user.role !== "elderly") {
    return res.status(403).json({ error: "Only the elderly user can mark their own tasks done" });
  }

  const taskId = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND elderly_id = ?").get(taskId, req.user.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const date = todayISO();
  ensureLogForToday(task, date);
  db.prepare(
    "UPDATE task_logs SET status = 'completed', completed_at = datetime('now') WHERE task_id = ? AND due_date = ?"
  ).run(taskId, date);

  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  const taskId = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (!canManage(req.user.id, req.user.role, task.elderly_id)) {
    return res.status(403).json({ error: "Not authorized for this task" });
  }

  db.prepare("UPDATE tasks SET active = 0 WHERE id = ?").run(taskId);
  res.json({ ok: true });
});

module.exports = router;
