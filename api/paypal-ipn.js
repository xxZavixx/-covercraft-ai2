import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const dbPath = path.join(process.cwd(), "db.json");

function readDB() {
  if (!fs.existsSync(dbPath)) {
    return { buyers: {} };
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Only POST allowed");
  }

  try {
    const body = new URLSearchParams(req.body).toString();

    const verifyRes = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cmd=_notify-validate&${body}`
    });

    const verifyText = await verifyRes.text();

    if (verifyText === "VERIFIED") {
      const {
        payment_status,
        receiver_email,
        payer_email,
        payer_id,
        first_name,
        last_name,
        mc_gross,
        txn_id
      } = req.body;

      const isCompleted = payment_status === "Completed";
      const isCorrectReceiver = receiver_email === "xzavierharris25@gmail.com";

      if (isCompleted && isCorrectReceiver) {
        const db = readDB();

        if (!db.buyers) db.buyers = {};
        const email = payer_email.toLowerCase();

        db.buyers[email] = {
          credits: 999, // Unlock permanently
          payer_id,
          payer_name: `${first_name} ${last_name}`,
          amount: mc_gross,
          lastPayment: new Date().toISOString(),
          txn_id
        };

        writeDB(db);
        console.log(`✅ Purchase verified and unlocked for ${email}`);
      } else {
        console.warn("⚠️ Payment failed or incorrect receiver email.");
      }
    } else {
      console.error("❌ IPN not verified by PayPal.");
    }

    res.status(200).end();
  } catch (err) {
    console.error("❌ IPN Handler Error:", err);
    res.status(500).end("Server error");
  }
}