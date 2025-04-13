// script.js

document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("userEmail");
  const email = emailInput?.value?.trim().toLowerCase();
  const resultBox = document.getElementById("resultBox");
  const countMsg = document.getElementById("genCountMsg");

  if (!email) {
    alert("Please enter your email.");
    emailInput?.focus();
    return;
  }

  // Step 1: Check credits
  countMsg.textContent = "Checking credits...";
  try {
    const checkRes = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
    const creditData = await checkRes.json();

    if (!checkRes.ok || creditData.credits <= 0) {
      alert("You’ve used all your free or purchased credits. Please buy more.");
      document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
  } catch (err) {
    console.error("Credit check error:", err);
    resultBox.textContent = "Error checking credits. Try again later.";
    return;
  }

  // Step 2: Submit form data
  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());
  resultBox.textContent = "Generating your cover letter... Please wait.";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInput)
    });
    const data = await res.json();

    if (res.ok && data.output) {
      resultBox.textContent = data.output;

      // Step 3: Consume 1 credit
      await fetch("/api/use-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      // Step 4: Update remaining credits
      const updateRes = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
      const updateData = await updateRes.json();
      if (updateRes.ok) {
        countMsg.textContent = `${updateData.credits} credits remaining.`;
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong.";
    }
  } catch (error) {
    console.error("API Error:", error);
    resultBox.textContent = "Network error. Try again later.";
  }
});

// Email unlock button
const emailUnlockForm = document.getElementById("emailUnlockForm");
if (emailUnlockForm) {
  emailUnlockForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const status = document.getElementById("unlockStatus");
    if (!email) {
      status.textContent = "Please enter a valid email.";
      return;
    }

    try {
      const res = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok && data.credits > 0) {
        document.getElementById("userEmail").value = email;
        status.textContent = "✅ Access restored.";
        document.getElementById("genCountMsg").textContent = `${data.credits} credits remaining.`;
      } else {
        status.textContent = "❌ No credits found for this email.";
      }
    } catch (error) {
      console.error(error);
      status.textContent = "❌ Error checking credits.";
    }
  });
}
