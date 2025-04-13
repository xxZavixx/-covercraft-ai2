import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const dbPath = path.join(process.cwd(), "db.json");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Only POST allowed");
  }

  try {
    const body = new URLSearchParams(req.body).toString();

    const verifyRes = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cmd=_notify-validate&${body}`,
    });

    const verifyText = await verifyRes.text();

    if (verifyText === "VERIFIED") {
      const {
        payment_status,
        receiver_email,
        payer_email,
        txn_id,
        first_name,
        last_name,
        mc_gross,
      } = req.body;

      const isCompleted = payment_status === "Completed";
      const isCorrectEmail = receiver_email === "xzavierharris25@gmail.com";

      if (isCompleted && isCorrectEmail) {
        const email = payer_email.toLowerCase();

        let db = {};
        try {
          const file = fs.readFileSync(dbPath, "utf8");
          db = JSON.parse(file);
        } catch {
          db = { buyers: {}, transactions: {} };
        }

        if (!db.buyers) db.buyers = {};
        if (!db.transactions) db.transactions = {};

        if (db.transactions[txn_id]) {
          console.log("Duplicate transaction.");
        } else {
          db.transactions[txn_id] = {
            email,
            amount: mc_gross,
            name: `${first_name} ${last_name}`,
            timestamp: new Date().toISOString(),
          };

          db.buyers[email] = {
            unlocked: true,
            paid: mc_gross,
            name: `${first_name} ${last_name}`,
            lastPayment: new Date().toISOString(),
          };

          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
          console.log(`✅ Access unlocked for ${email}`);
        }
      } else {
        console.warn("⚠️ Payment incomplete or wrong PayPal email.");
      }
    } else {
      console.error("❌ IPN not verified.");
    }

    res.status(200).end();
  } catch (error) {
    console.error("❌ IPN handler error:", error);
    res.status(500).end("Internal Server Error");
  }
}