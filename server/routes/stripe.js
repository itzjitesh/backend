// server/routes/stripe.js
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

router.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("create-checkout-session body:", req.body);

    const { email, userId } = req.body || {};
    // fallback: accept either userId or _id
    const metadata = {
      userId: userId || "",
      email: email || "",
    };

    if (!process.env.STRIPE_PRICE_PRO) {
      console.error("STRIPE_PRICE_PRO is missing");
      return res.status(500).json({ message: "Stripe price not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
      customer_email: email || undefined,
      metadata,
      success_url: `${process.env.CLIENT_URL || process.env.DOMAIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || process.env.DOMAIN}/billing/cancel`,
    });

    console.log(
      "created stripe session:",
      session.id,
      "metadata:",
      session.metadata,
    );
    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("Create checkout session error:", err);
    return res
      .status(500)
      .json({ message: "Could not create checkout session" });
  }
});

/**
 * POST /api/stripe/complete-checkout
 * Body: { sessionId }
 *
 * This endpoint verifies the Stripe session, upgrades the user (if needed),
 * and returns a JWT + user object so the frontend can auto-login.
 */
router.post("/complete-checkout", async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId)
      return res.status(400).json({ message: "Missing sessionId" });

    // Fetch session from Stripe (ensures we have the latest data)
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Basic session validation
    // For subscription mode, you can check session.payment_status === 'paid'
    if (
      !session ||
      (session.payment_status !== "paid" && session.status !== "complete")
    ) {
      // Not paid yet
      return res
        .status(400)
        .json({ message: "Session not completed (payment pending)" });
    }

    // Try to get metadata first (set at session creation)
    let metadata = session.metadata || {};

    // If metadata empty, attempt to retrieve the expanded session (or subscription)
    if (!metadata || Object.keys(metadata).length === 0) {
      try {
        const fetched = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["subscription"],
        });
        metadata = fetched.metadata || {};
      } catch (e) {
        console.warn("Could not fetch expanded session:", e.message);
      }
    }

    const userId = metadata.userId || metadata.user_id || null;
    const email = metadata.email || session.customer_email || null;

    // Find user by id or email or by stripe customer id saved in subscription
    let user = null;
    if (userId) user = await User.findById(userId);
    if (!user && email) user = await User.findOne({ email: email });
    if (!user && session.customer) {
      user = await User.findOne({
        "subscription.stripeCustomerId": session.customer,
      });
    }

    if (!user) {
      // Nothing we can do — return success but indicate user not found
      console.warn(
        "No user found for session",
        sessionId,
        "metadata:",
        metadata,
      );
      return res
        .status(404)
        .json({ message: "No user found for this session" });
    }

    // Mark user as PRO if not already
    user.subscription = user.subscription || {};
    user.subscription.tier = "pro";
    user.subscription.stripeCustomerId =
      session.customer || user.subscription.stripeCustomerId;
    user.subscription.stripeSessionId = session.id;
    user.subscription.subscribedAt = new Date();

    await user.save();

    // Create JWT (same as login)
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d",
    });

    // Return token + user (strip sensitive fields if needed)
    const safeUser = {
      _id: String(user._id),
      email: user.email,
      subscription: user.subscription,
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("complete-checkout error:", err);
    return res.status(500).json({ message: "Could not complete checkout" });
  }
});

module.exports = router;
