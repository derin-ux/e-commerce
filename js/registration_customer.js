const form = document.getElementById("customerRegisterForm");
const message = document.getElementById("registerMessage");
const submitBtn = form.querySelector("button[type='submit']");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); 
  message.textContent = "";

  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    return;
  }

  submitBtn.disabled = true; 
  submitBtn.textContent = "Creating account...";

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        role: "customer",
      }),
    });

    
    saveSession(data.token, data.user);
    window.location.href = "index.html";
  } catch (err) {
    message.textContent = err.message; 
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});