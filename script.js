document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("userEmail");
  const countMsg = document.getElementById("genCountMsg");

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("pro") === "1") {
    localStorage.setItem("isProUser", "true");
    localStorage.setItem("freeCount", "0");
    alert("Thanks for upgrading to CoverCraft Pro!");
    history.replaceState(null, "", window.location.pathname);
  }

  const storedEmail = localStorage.getItem("userEmail");
  const isProUser = localStorage.getItem("isProUser") === "true";
  let freeCount = parseInt(localStorage.getItem("freeCount") || "0");

  if (storedEmail && emailInput) {
    emailInput.value = storedEmail;
  }

  if (isProUser) {
    countMsg.textContent = "Pro access unlocked.";
  } else {
    countMsg.textContent = `${freeCount}/2 free uses used.`;
  }
});

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

  localStorage.setItem("userEmail", email);

  const isProUser = localStorage.getItem("isProUser") === "true";
  let freeCount = parseInt(localStorage.getItem("freeCount") || "0");

  if (!isProUser && freeCount >= 2) {
    alert("You've used your 2 free tries. Please upgrade to unlock more.");
    document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());

  resultBox.textContent = "Generating your cover letter... Please wait.";

  try {
    const response = await fetch("/api/generate.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInput)
    });

    const data = await response.json();

    if (response.ok && data.output) {
      resultBox.textContent = data.output;

      if (!isProUser) {
        freeCount++;
        localStorage.setItem("freeCount", freeCount.toString());
        countMsg.textContent = `${freeCount}/2 free uses used.`;
      } else {
        countMsg.textContent = "Pro access unlocked.";
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong.";
    }
  } catch (err) {
    console.error("API error:", err);
    resultBox.textContent = "Network error. Please try again later.";
  }
});