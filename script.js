document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("userEmail");
  const countMsg = document.getElementById("genCountMsg");

  // Handle redirect from PayPal IPN
  const params = new URLSearchParams(window.location.search);
  if (params.get("pro") === "1") {
    localStorage.setItem("isProUser", "true");
    alert("Thank you for upgrading to CoverCraft Pro!");
    history.replaceState({}, document.title, window.location.pathname);
  }

  // Initialize localStorage credit counter
  if (!localStorage.getItem("coverTries")) {
    localStorage.setItem("coverTries", "0");
  }

  // Display credit status
  const tries = parseInt(localStorage.getItem("coverTries") || "0");
  const isPro = localStorage.getItem("isProUser") === "true";

  if (countMsg) {
    if (isPro) {
      countMsg.textContent = "Pro access unlocked.";
    } else {
      countMsg.textContent = `${tries}/2 free uses used.`;
    }
  }
});

// Form submission handler
document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("userEmail");
  const email = emailInput?.value?.trim().toLowerCase();

  if (!email) {
    alert("Please enter your email.");
    emailInput?.focus();
    return;
  }

  localStorage.setItem("userEmail", email);

  const isPro = localStorage.getItem("isProUser") === "true";
  let tries = parseInt(localStorage.getItem("coverTries") || "0");

  if (!isPro && tries >= 2) {
    alert("You've used your 2 free tries. Please purchase Pro to continue.");
    document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());
  const resultBox = document.getElementById("resultBox");
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

      if (!isPro) {
        tries += 1;
        localStorage.setItem("coverTries", tries.toString());
        const countMsg = document.getElementById("genCountMsg");
        if (countMsg) {
          countMsg.textContent = `${tries}/2 free uses used.`;
        }
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong.";
    }
  } catch (err) {
    console.error("Error generating:", err);
    resultBox.textContent = "Error contacting the AI. Try again later.";
  }
});