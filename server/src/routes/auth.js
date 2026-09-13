const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const db = require("../db");

const { authRequired } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex"); // 8 hex chars, easy to read aloud/type
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 1, max: 100 }).escape(),
    body("email").trim().isEmail().normalizeEmail(),
    body("password").isLength({ min: 8, max: 200 }),
    body("role").isIn(["elderly", "caregiver"]),
    body("phone").optional().trim().isLength({ max: 30 }),
    body("emergencyPhone").optional().trim().isLength({ max: 30 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid input", details: errors.array() });
    }

    const { name, email, password, role, phone, emergencyPhone } = req.body;

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const inviteCode = role === "elderly" ? generateInviteCode() : null;

    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash, role, invite_code, phone, emergency_phone) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(name, email, passwordHash, role, inviteCode, phone || null, emergencyPhone || null);

    const user = { id: result.lastInsertRowid, role };
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name,
        email,
        role,
        inviteCode,
        phone: phone || null,
        emergencyPhone: emergencyPhone || null,
      },
    });
  }
);

router.post(
  "/login",
  loginLimiter,
  [body("email").trim().isEmail().normalizeEmail(), body("password").isString().notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    // Generic error message avoids revealing whether the email is registered
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        inviteCode: user.invite_code,
        phone: user.phone || null,
        emergencyPhone: user.emergency_phone || null,
      },
    });
  }
);

router.get("/me", authRequired, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role, invite_code, phone, emergency_phone FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      inviteCode: user.invite_code,
      phone: user.phone || null,
      emergencyPhone: user.emergency_phone || null,
    },
  });
});

router.put(
  "/profile",
  authRequired,
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }),
    body("phone").optional().trim().isLength({ max: 30 }),
    body("emergencyPhone").optional().trim().isLength({ max: 30 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input" });

    const { name, phone, emergencyPhone } = req.body;
    const current = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!current) return res.status(404).json({ error: "User not found" });

    const newName = name !== undefined ? name : current.name;
    const newPhone = phone !== undefined ? phone : current.phone;
    const newEmergencyPhone = emergencyPhone !== undefined ? emergencyPhone : current.emergency_phone;

    db.prepare("UPDATE users SET name = ?, phone = ?, emergency_phone = ? WHERE id = ?").run(
      newName,
      newPhone,
      newEmergencyPhone,
      req.user.id
    );

    res.json({
      user: {
        id: current.id,
        name: newName,
        email: current.email,
        role: current.role,
        inviteCode: current.invite_code,
        phone: newPhone,
        emergencyPhone: newEmergencyPhone,
      },
    });
  }
);

module.exports = router;
