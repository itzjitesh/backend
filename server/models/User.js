const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  pathPreference: {
    type: String,
    enum: ["revenue", "indicative"],
    default: "indicative",
  },
  subscription: {
    tier: { type: String, enum: ["free", "pro", "team"], default: "free" },
    stripeCustomerId: String,
    stripeSessionId: String,
    subscribedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
