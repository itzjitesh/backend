// server/routes/stripeWebhook.js
const stripeLib = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User"); // ensure path correct

module.exports = async function stripeWebhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).send("Webhook not configured");
  }

  let event;
  try {
    event = stripeLib.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Webhook received checkout.session.completed:", session.id);
      console.log("session.metadata (raw):", session.metadata);

      // Workaround: if metadata empty, fetch session from Stripe to ensure we have latest
      let metadata = session.metadata || {};
      if (!metadata || Object.keys(metadata).length === 0) {
        try {
          const fetched = await stripeLib.checkout.sessions.retrieve(
            session.id,
          );
          metadata = fetched.metadata || {};
          console.log("Fetched session metadata fallback:", metadata);
        } catch (fetchErr) {
          console.warn(
            "Could not fetch session from Stripe:",
            fetchErr.message,
          );
        }
      }

      // Try to find user
      let user = null;
      const userId = metadata.userId;
      const email = metadata.email;
      if (userId) {
        user = await User.findById(userId);
      }
      if (!user && email) {
        user = await User.findOne({ email: email });
      }
      // Try to find by stripe customer id in case user already stored it earlier
      if (!user && session.customer) {
        user = await User.findOne({
          "subscription.stripeCustomerId": session.customer,
        });
      }

      if (user) {
        user.subscription = user.subscription || {};
        user.subscription.tier = "pro";
        user.subscription.stripeCustomerId =
          session.customer || user.subscription.stripeCustomerId;
        user.subscription.stripeSessionId = session.id;
        user.subscription.subscribedAt = new Date();
        await user.save();
        console.log(`User ${user.email || user._id} upgraded to PRO`);
      } else {
        console.log(
          "No user found to upgrade for session",
          session.id,
          "metadata:",
          metadata,
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    res.status(500).send();
  }
};
