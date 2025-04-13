import fs from "fs";
const path = "./db.json";

export default function handler(req, res) {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.status(400).json({ error: "Missing email" });

  const db = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
  const user = db[email];
  res.status(200).json({ credits: user?.credits ?? 2 });
}

