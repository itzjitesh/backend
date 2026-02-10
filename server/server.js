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

// const FRONTEND_URL =
// process.env.CLIENT_URL || "https://frontend-red-kappa-41.vercel.app/";

const app = express();

// app.use(cors({ origin: FRONTEND_URL }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://frontend-red-kappa-41.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
  }),
);

// app.options("*", cors());

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

// JSON parser for all other routes
app.use(express.json());

// Mount other routes (including non-webhook stripe routes)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/calculators", calculatorsRoutes);
app.use("/calculators", calculatorsRoutes);
app.use("/api/scenarios", scenariosRoutes);
app.use("/scenarios", scenariosRoutes);
app.use("/api/stripe", stripeRoutes); // contains reate-checkout-session
app.use("/stripe", stripeRoutes);

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
