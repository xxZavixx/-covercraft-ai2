// /api/check-credits.js

import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "db.json");

export default async function handler(req, res) {
  const email = req.query.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const user = db.buyers?.[email];

    // Default to 2 free credits if not found
    const credits = user ? user.credits || 0 : 2;

    return res.status(200).json({ credits });
  } catch (err) {
    console.error("Error reading db.json:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
