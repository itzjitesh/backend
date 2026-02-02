// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const calculatorsRoutes = require("./routes/calculators");
const scenariosRoutes = require("./routes/scenarios");
const stripeRoutes = require("./routes/stripe"); // create-checkout-session
const stripeWebhookHandler = require("./routes/stripeWebhook"); // webhook handler
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // optional if used elsewhere

const app = express();

// CORS: allow your client
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/**
 * IMPORTANT:
 * Mount the Stripe webhook route with express.raw() BEFORE express.json()
 * so the raw body is available for signature verification.
 */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

// JSON parser for all other routes
app.use(express.json());

// Mount other routes (including non-webhook stripe routes)
app.use("/api/auth", authRoutes);
app.use("/api/calculators", calculatorsRoutes);
app.use("/api/scenarios", scenariosRoutes);
app.use("/api/stripe", stripeRoutes); // contains create-checkout-session

// check
app.get("/", (req, res) => res.send("ValueLens API"));

// connect DB and start
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/valuelens";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Mongoose connected");
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connect err:", err);
  });
