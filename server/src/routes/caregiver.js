const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");
const { todayISO, isDueToday, ensureLogForToday } = require("../scheduleUtils");

const router = express.Router();
router.use(authRequired);

// Caregiver links themselves to an elderly user using the invite code the elderly user shared
router.post(
  "/link",
  requireRole("caregiver"),
  [body("inviteCode").trim().isLength({ min: 1, max: 32 })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input" });

    const elderly = db
      .prepare("SELECT id, name, email, phone, emergency_phone FROM users WHERE invite_code = ? AND role = 'elderly'")
      .get(req.body.inviteCode);

    if (!elderly) {
      return res.status(404).json({ error: "Invite code not found" });
    }

    const already = db
      .prepare("SELECT id FROM links WHERE caregiver_id = ? AND elderly_id = ?")
      .get(req.user.id, elderly.id);
    if (already) {
      return res.status(409).json({ error: "Already linked to this person" });
    }

    db.prepare("INSERT INTO links (caregiver_id, elderly_id) VALUES (?, ?)").run(
      req.user.id,
      elderly.id
    );

    res.status(201).json({
      linked: {
        id: elderly.id,
        name: elderly.name,
        email: elderly.email,
        phone: elderly.phone,
        emergencyPhone: elderly.emergency_phone,
      },
    });
  }
);

// List elderly users linked to the logged-in caregiver
router.get("/linked", requireRole("caregiver"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.emergency_phone AS emergencyPhone FROM links l
       JOIN users u ON u.id = l.elderly_id
       WHERE l.caregiver_id = ?`
    )
    .all(req.user.id);

  // Attach today's summary stats for each linked senior
  const date = todayISO();
  const enhanced = rows.map((person) => {
    const tasks = db
      .prepare("SELECT * FROM tasks WHERE elderly_id = ? AND active = 1")
      .all(person.id)
      .filter((t) => isDueToday(t, date));

    let completed = 0;
    let pending = 0;
    let missed = 0;

    tasks.forEach((t) => {
      const log = ensureLogForToday(t, date);
      if (log.status === "completed") completed++;
      else if (log.status === "missed") missed++;
      else pending++;
    });

    return {
      ...person,
      todaySummary: { total: tasks.length, completed, pending, missed },
    };
  });

  res.json({ elderly: enhanced });
});

// View today's tasks for a linked senior
router.get("/linked/:elderlyId/today", requireRole("caregiver"), (req, res) => {
  const elderlyId = Number(req.params.elderlyId);
  const link = db
    .prepare("SELECT id FROM links WHERE caregiver_id = ? AND elderly_id = ?")
    .get(req.user.id, elderlyId);
  if (!link) return res.status(403).json({ error: "Not authorized to view this person" });

  const date = todayISO();
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE elderly_id = ? AND active = 1")
    .all(elderlyId)
    .filter((t) => isDueToday(t, date));

  const withStatus = tasks.map((t) => {
    const log = ensureLogForToday(t, date);
    return { ...t, status: log.status, completedAt: log.completed_at };
  });

  withStatus.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
  res.json({ date, tasks: withStatus });
});

// List caregivers linked to the logged-in elderly user (so the elderly person can see their caregivers & phone numbers)
router.get("/my-caregivers", (req, res) => {
  if (req.user.role !== "elderly") {
    return res.status(403).json({ error: "Only elderly users can check their caregivers" });
  }

  const caregivers = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone FROM links l
       JOIN users u ON u.id = l.caregiver_id
       WHERE l.elderly_id = ?`
    )
    .all(req.user.id);

  res.json({ caregivers });
});

// Trigger a check-in or emergency alert from elderly user to all linked caregivers
router.post(
  "/trigger-alert",
  [
    body("type").isIn(["emergency", "checkin", "test"]),
    body("customMessage").optional().trim().isLength({ max: 300 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input" });

    const elderly = db.prepare("SELECT id, name, phone FROM users WHERE id = ?").get(req.user.id);
    if (!elderly) return res.status(404).json({ error: "User not found" });

    const caregivers = db
      .prepare("SELECT caregiver_id FROM links WHERE elderly_id = ?")
      .all(elderly.id);

    if (caregivers.length === 0) {
      return res.status(400).json({
        error: "No caregivers linked yet. Please share your invite code with your caregiver first.",
      });
    }

    const type = req.body.type;
    let messagePrefix = "";
    if (type === "emergency") {
      messagePrefix = `🚨 URGENT: ${elderly.name} requested immediate assistance / help!`;
    } else if (type === "checkin") {
      messagePrefix = `👋 Check-in from ${elderly.name}: "I am checking in to let you know everything is okay."`;
    } else {
      messagePrefix = `🧪 [TEST ALERT] ${elderly.name} sent a test alert from the Senior Schedule app.`;
    }

    const finalMessage = req.body.customMessage
      ? `${messagePrefix} Note: ${req.body.customMessage}`
      : messagePrefix;

    const insertAlert = db.prepare(
      "INSERT INTO alerts (caregiver_id, elderly_id, task_id, message, alert_type) VALUES (?, ?, NULL, ?, ?)"
    );

    for (const c of caregivers) {
      insertAlert.run(c.caregiver_id, elderly.id, finalMessage, type);
    }

    res.json({ ok: true, sentCount: caregivers.length, message: finalMessage });
  }
);

// List alerts for the logged-in caregiver, most recent first
router.get("/alerts", requireRole("caregiver"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.id, a.message, a.alert_type, a.is_read, a.created_at, 
              u.id AS elderly_id, u.name AS elderly_name, u.phone AS elderly_phone, u.emergency_phone AS elderly_emergency_phone,
              t.title AS task_title, t.scheduled_time AS task_time
       FROM alerts a
       JOIN users u ON u.id = a.elderly_id
       LEFT JOIN tasks t ON t.id = a.task_id
       WHERE a.caregiver_id = ?
       ORDER BY a.created_at DESC
       LIMIT 200`
    )
    .all(req.user.id);
  res.json({ alerts: rows });
});

router.post("/alerts/:id/read", requireRole("caregiver"), (req, res) => {
  const alertId = Number(req.params.id);
  if (!Number.isInteger(alertId)) return res.status(400).json({ error: "Invalid alert id" });

  const result = db
    .prepare("UPDATE alerts SET is_read = 1 WHERE id = ? AND caregiver_id = ?")
    .run(alertId, req.user.id);

  if (result.changes === 0) return res.status(404).json({ error: "Alert not found" });
  res.json({ ok: true });
});

// Mark all alerts as read
router.post("/alerts/read-all", requireRole("caregiver"), (req, res) => {
  db.prepare("UPDATE alerts SET is_read = 1 WHERE caregiver_id = ?").run(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
