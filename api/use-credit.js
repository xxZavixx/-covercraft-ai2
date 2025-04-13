import fs from "fs";
const path = "./db.json";

export default function handler(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const db = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
  if (!db[email]) db[email] = { credits: 1 };
  db[email].credits = Math.max((db[email].credits ?? 2) - 1, 0);
  fs.writeFileSync(path, JSON.stringify(db, null, 2));

  res.status(200).json({ credits: db[email].credits });
}

