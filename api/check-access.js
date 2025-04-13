import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "db.json");

export default async function handler(req, res) {
  const email = req.query.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const data = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(data);

    const unlocked = db?.buyers?.[email]?.unlocked || false;

    return res.status(200).json({ unlocked });
  } catch (error) {
    console.error("Error checking access:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
