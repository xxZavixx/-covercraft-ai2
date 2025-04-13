document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("userEmail");
  const genCountMsg = document.getElementById("genCountMsg");
  const storedEmail = localStorage.getItem("userEmail");

  if (storedEmail && emailInput) {
    emailInput.value = storedEmail;
    const res = await fetch(`/api/check-credits?email=${storedEmail}`);
    const data = await res.json();
    if (res.ok) genCountMsg.textContent = `${data.credits} credits remaining.`;
  }
});

document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim().toLowerCase();
  localStorage.setItem("userEmail", email);

  const resCheck = await fetch(`/api/check-credits?email=${email}`);
  const { credits } = await resCheck.json();
  if (credits <= 0) return alert("Out of credits. Please pay to continue.");

  const resultBox = document.getElementById("resultBox");
  resultBox.textContent = "Generating your cover letter...";

  const body = JSON.stringify(Object.fromEntries(new FormData(form)));
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await response.json();
  resultBox.textContent = data.output || "Error generating letter.";

  await fetch("/api/use-credit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
});
