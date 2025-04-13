import fs from "fs";
import { buffer } from "micro";
const path = "./db.json";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const rawBody = (await buffer(req)).toString();

  const verifyRes = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `cmd=_notify-validate&${rawBody}`,
  });

  const verified = await verifyRes.text();
  if (verified !== "VERIFIED") return res.status(400).end("Invalid IPN");

  const parsed = Object.fromEntries(new URLSearchParams(rawBody));
  const {
    payment_status,
    receiver_email,
    payer_email,
    txn_id,
    mc_gross,
  } = parsed;

  if (payment_status === "Completed" && receiver_email === "xzavierharris25@gmail.com") {
    const db = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
    const email = payer_email.toLowerCase();
    db[email] = db[email] || { credits: 0 };
    db[email].credits += 15;
    fs.writeFileSync(path, JSON.stringify(db, null, 2));
    console.log(`✅ Added 15 credits to ${email}`);
  }

  res.status(200).end();
}

