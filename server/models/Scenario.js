const mongoose = require("mongoose");

const ScenarioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  calculator: {
    type: String,
    required: true,
  },
  inputs: {
    type: Object,
    required: true,
  },
  output: {
    type: Object,
    required: true,
  },
  narrative: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ScenarioSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Scenario", ScenarioSchema);
