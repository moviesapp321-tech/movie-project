const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginType = document.getElementById("loginType").value;

    if (!email || !password || !loginType) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
          loginType,
        }),
      });

      const data = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        alert(data.message);
        return;
      }

      // =================================================
      // USER LOGIN → OTP REQUIRED
      // =================================================

      if (loginType === "user" && data.otpRequired === true) {
        // Temporary OTP information
        sessionStorage.setItem("otpToken", data.otpToken);
        sessionStorage.setItem("otpEmail", data.email);

        alert("OTP has been sent to your registered Gmail!");

        window.location.href = "otp.html";

        return;
      }

      // =================================================
      // ADMIN LOGIN → DIRECT LOGIN
      // =================================================

      if (data.user.role === "admin") {
        localStorage.setItem("token", data.token);

        localStorage.setItem("currentUser", JSON.stringify(data.user));

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("isAdmin", "true");

        alert("Admin login successful!");

        window.location.href = "admin.html";

        return;
      }

      // =================================================
      // FALLBACK USER LOGIN
      // =================================================

      localStorage.setItem("token", data.token);

      localStorage.setItem("currentUser", JSON.stringify(data.user));

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("isAdmin", "false");

      alert("User login successful!");

      window.location.href = "index.html";
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      alert("Backend server is not running!");
    }
  });
}
