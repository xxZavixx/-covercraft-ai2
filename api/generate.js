export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobTitle, company, skills, experience, tone } = req.body;

  if (!jobTitle || !company || !skills || !experience || !tone) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const prompt = `Write a ${tone.toLowerCase()} cover letter for the following job:

Job Title: ${jobTitle}
Company: ${company}
Key Skills: ${skills}
Experience: ${experience}

Be concise, persuasive, and professional. Format properly for a real job application.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const output = data?.content?.[0]?.text?.trim();

    if (!output) {
      return res.status(500).json({ error: "Claude returned no content." });
    }

    return res.status(200).json({ output });
  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: "Claude API error. Please try again later." });
  }
}