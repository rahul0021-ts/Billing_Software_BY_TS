const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

// POST /api/auth/login
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "ValidationError", message: errors.array()[0].msg });
      }

      const { username, password } = req.body;
      const user = await User.findOne({ username: username.toLowerCase().trim() });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid username or password" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid username or password" });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      });

      return res.json({
        success: true,
        data: {
          token,
          user: { id: user._id, username: user.username, role: user.role },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/register
router.post(
  "/register",
  [
    body("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("setupKey").notEmpty().withMessage("Setup key is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "ValidationError", message: errors.array()[0].msg });
      }

      const { username, password, setupKey, role } = req.body;

      if (setupKey !== process.env.JWT_SECRET) {
        return res.status(403).json({ error: "Forbidden", message: "Invalid setup key" });
      }

      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ error: "DuplicateKey", message: "Username already taken" });
      }

      const user = await User.create({
        username: username.toLowerCase().trim(),
        password,
        role: role || "admin",
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      });

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: { id: user._id, username: user.username, role: user.role },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get("/me", verifyToken, (req, res) => {
  return res.json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = router;