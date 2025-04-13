document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("userEmail");
  const countMsg = document.getElementById("genCountMsg");

  const storedEmail = localStorage.getItem("userEmail");
  const isProUser = localStorage.getItem("isProUser") === "true";
  let freeCount = parseInt(localStorage.getItem("freeCount") || "0");

  if (storedEmail && emailInput) {
    emailInput.value = storedEmail;
  }

  // Show current status
  if (isProUser) {
    countMsg.textContent = "Pro access unlocked.";
  } else {
    countMsg.textContent = `${freeCount}/2 free uses used.`;
  }

  // Lemon Squeezy event listener
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://app.lemonsqueezy.com") return;
    if (event.data && event.data.type === "lemon.success") {
      localStorage.setItem("isProUser", "true");
      localStorage.setItem("freeCount", "0");
      alert("Thank you for subscribing to CoverCraft Pro!");
      if (countMsg) countMsg.textContent = "Pro access unlocked.";
    }
  });
});

document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("userEmail");
  const resultBox = document.getElementById("resultBox");
  const countMsg = document.getElementById("genCountMsg");

  const email = emailInput?.value?.trim().toLowerCase();
  if (!email) {
    alert("Please enter your email.");
    emailInput?.focus();
    return;
  }

  localStorage.setItem("userEmail", email);
  const isProUser = localStorage.getItem("isProUser") === "true";
  let freeCount = parseInt(localStorage.getItem("freeCount") || "0");

  // Enforce limits
  if (!isProUser && freeCount >= 2) {
    alert("You've used all your free generations. Subscribe to unlock more!");
    document.querySelector(".lemonsqueezy-button")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());

  resultBox.textContent = "Generating your cover letter... Please wait.";

  try {
    const response = await fetch("/api/generate.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInput),
    });

    const data = await response.json();

    if (response.ok && data.output) {
      resultBox.textContent = data.output;

      // Track free usage
      if (!isProUser) {
        freeCount++;
        localStorage.setItem("freeCount", freeCount.toString());
        if (countMsg) countMsg.textContent = `${freeCount}/2 free uses used.`;
      } else {
        if (countMsg) countMsg.textContent = "Pro access unlocked.";
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong.";
    }
  } catch (err) {
    console.error(err);
    resultBox.textContent = "Network error. Please try again later.";
  }
});