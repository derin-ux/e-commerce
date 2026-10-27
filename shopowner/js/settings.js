document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("settingsForm");
  const message = document.getElementById("settingsMessage");
  const storageKey = "stylehubShopSettings";

  const savedSettings =
    JSON.parse(localStorage.getItem(storageKey)) || {};

  ["shopName", "description", "email", "phone", "location"]
    .forEach(name => {
      if (savedSettings[name]) {
        form.elements[name].value = savedSettings[name];
      }
    });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const settings = {
      shopName: form.elements.shopName.value.trim(),
      description: form.elements.description.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      location: form.elements.location.value.trim()
    };

    if (!settings.shopName || !settings.email || !settings.phone) {
      message.textContent = "Please complete all required fields.";
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(settings));

    message.textContent = "Shop settings saved in this browser.";
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("stylehubShopLoggedIn");
      window.location.href = "login.html";
    }
  });
});