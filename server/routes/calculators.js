// server/routes/calculators.js
const express = require("express");
const optionalAuth = require("../middleware/optionalAuth");
const {
  calculateCampaignROI,
  generateCampaignNarrative,
} = require("../logic/campaignROI");
const { calculateCPA, generateCPANarrative } = require("../logic/cpa");
const router = express.Router();

// run without requiring login (try-first UX)
router.post("/campaign-roi", optionalAuth, (req, res) => {
  try {
    const inputs = req.body || {};
    const result = calculateCampaignROI(inputs);
    const narrative = generateCampaignNarrative(inputs, result, req.user);
    return res.json({ inputs, result, narrative });
  } catch (err) {
    console.error("Calculation error:", err);
    return res
      .status(400)
      .json({ message: "Calculation error", error: err.message });
  }
});

// CPA
router.post("/cpa", optionalAuth, (req, res) => {
  try {
    const inputs = req.body || {};
    const result = calculateCPA(inputs);
    const narrative = generateCPANarrative(inputs, result, req.user);

    return res.json({ inputs, result, narrative });
  } catch (err) {
    console.error("CPA error:", err);
    return res
      .status(400)
      .json({ message: "Calculation error", error: err.message });
  }
});

module.exports = router;
