// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ensure this is at top-level and before usage

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, subscription: user.subscription || {} },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  );
}

// Signup - safe error handling
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    // Check if user exists
    const existing = await User.findOne({ email }).lean().exec();
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    const token = createToken(user);
    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        subscription: user.subscription || {},
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ err: err, message: "Signup failed" });
  }
});

// Login - safe error handling
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = createToken(user);
    return res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        subscription: user.subscription || {},
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
