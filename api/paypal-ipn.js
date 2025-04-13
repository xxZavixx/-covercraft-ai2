// /api/paypal-ipn.js

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const dbPath = path.join(process.cwd(), "db.json");
const RECEIVER_EMAIL = "xzavierharris25@gmail.com"; // Update to your PayPal business email

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Only POST allowed");
  }

  try {
    const bodyStr = new URLSearchParams(req.body).toString();

    // Verify IPN message with PayPal
    const verifyRes = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cmd=_notify-validate&${bodyStr}`,
    });

    const verifyText = await verifyRes.text();

    if (verifyText !== "VERIFIED") {
      console.error("❌ Invalid PayPal IPN message.");
      return res.status(400).end("IPN not verified");
    }

    const {
      payment_status,
      receiver_email,
      payer_email,
      txn_id,
      payer_id,
      first_name,
      last_name,
      mc_gross
    } = req.body;

    if (payment_status !== "Completed" || receiver_email !== RECEIVER_EMAIL) {
      console.warn("⚠️ Payment not completed or sent to wrong email.");
      return res.status(400).end();
    }

    const email = payer_email.toLowerCase();

    // Load database
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    // Avoid duplicate txn_ids (you can store them if needed)
    if (!db.buyers[email]) {
      db.buyers[email] = {
        credits: 15,
        payer_id,
        payer_name: `${first_name} ${last_name}`,
        amount: mc_gross,
        lastPayment: new Date().toISOString()
      };
    } else {
      db.buyers[email].credits = (db.buyers[email].credits || 0) + 15;
      db.buyers[email].payer_id = payer_id;
      db.buyers[email].payer_name = `${first_name} ${last_name}`;
      db.buyers[email].amount = mc_gross;
      db.buyers[email].lastPayment = new Date().toISOString();
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`✅ ${email} was credited with 15 cover letter uses.`);

    res.status(200).end("OK");
  } catch (err) {
    console.error("❌ PayPal IPN handler error:", err);
    res.status(500).end("Server error");
  }
}

