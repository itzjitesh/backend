// server/routes/scenario.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Scenario = require("../models/Scenario");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Simple auth middleware (returns req.user with id and email)
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string")
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * POST /api/scenarios
 * Save a scenario for the logged-in user with free-tier limit enforcement.
 */
router.post("/", auth, async (req, res) => {
  try {
    const { calculator, inputs, output, narrative } = req.body;
    const userId = req.user.id;

    // fetch user's subscription tier
    const user = await User.findById(userId).lean();
    const tier = user?.subscription?.tier || "free";

    // enforce free-tier save limit (1)
    if (tier === "free") {
      // count by the 'user' field (ObjectId reference)
      const count = await Scenario.countDocuments({ user: userId }).exec();
      if (count >= 1) {
        return res.status(402).json({
          message: "Save limit reached - upgrade to Pro to save more",
        });
      }
    }

    const scenario = await Scenario.create({
      user: userId,
      calculator,
      inputs,
      output,
      narrative,
    });

    return res.status(201).json(scenario);
  } catch (err) {
    console.error("Save scenario error", err);
    return res.status(500).json({ message: "Could not save scenario" });
  }
});

/**
 * GET /api/scenarios
 * List scenarios for the logged-in user
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await Scenario.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(list);
  } catch (err) {
    console.error("List scenarios error:", err);
    return res.status(500).json({ message: "Could not retrieve scenarios" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Scenario.deleteOne({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Could not delete" });
  }
});

module.exports = router;
