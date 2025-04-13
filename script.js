// script.js

const emailInput = document.getElementById("userEmail");
const countMsg = document.getElementById("genCountMsg");
const resultBox = document.getElementById("resultBox");

// Default free usage limit
const FREE_LIMIT = 2;

// Check and update credits when form is submitted
document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput?.value?.trim().toLowerCase();
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  try {
    const res = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!res.ok || (!data.unlocked && data.creditsLeft <= 0)) {
      alert("You’ve used all your free credits. Please purchase to unlock full access.");
      document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Generate cover letter
    const formData = new FormData(e.target);
    const userInput = Object.fromEntries(formData.entries());
    resultBox.textContent = "Generating your cover letter... Please wait.";

    const generateRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInput),
    });

    const generateData = await generateRes.json();
    if (generateRes.ok && generateData.output) {
      resultBox.textContent = generateData.output;

      // Use a credit
      await fetch("/api/use-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      updateCredits(email);
    } else {
      resultBox.textContent = generateData.error || "Something went wrong generating your cover letter.";
    }
  } catch (error) {
    console.error("Network error:", error);
    resultBox.textContent = "Network error. Please try again later.";
  }
});

async function updateCredits(email) {
  try {
    const res = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (res.ok) {
      countMsg.textContent = data.unlocked
        ? "Pro Access: Unlimited"
        : `${data.creditsLeft} free uses remaining`;
    }
  } catch (e) {
    countMsg.textContent = "Could not fetch credits.";
  }
}
