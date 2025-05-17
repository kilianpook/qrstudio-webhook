
// set-pro.js
// Webhook-Endpunkt zum Aktualisieren von Supabase 'pro'-Status via Stripe

import express from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ type: "application/json" }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Stripe Webhook-Handler
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Nur auf erfolgreiche Zahlungen reagieren
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details.email;

    const { data, error } = await supabase
      .from("profiles")
      .update({ pro: true })
      .eq("email", email);

    if (error) {
      console.error("Supabase Update Error:", error);
      return res.status(500).json({ success: false });
    }

    return res.json({ success: true });
  }

  res.json({ received: true });
});

app.listen(4242, () => console.log("🚀 Webhook server running on port 4242"));
