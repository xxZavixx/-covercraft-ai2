// /api/use-credit.js

import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "db.json");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    // Create buyer record if doesn't exist
    if (!db.buyers[email]) {
      db.buyers[email] = {
        credits: 1 // since one will be subtracted below, 2 total default
      };
    }

    const currentCredits = db.buyers[email].credits || 0;

    if (currentCredits <= 0) {
      return res.status(403).json({ error: "No credits remaining" });
    }

    db.buyers[email].credits = currentCredits - 1;

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`✅ 1 credit used for ${email}. Remaining: ${db.buyers[email].credits}`);

    return res.status(200).json({ success: true, remaining: db.buyers[email].credits });
  } catch (err) {
    console.error("Error updating credits:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
