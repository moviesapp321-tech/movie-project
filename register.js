const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const password = document.getElementById("password").value.trim();
    const gender = document.getElementById("gender").value;

    if (!name || !email || !mobile || !password || !gender) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name,
          email: email,
          mobile: mobile,
          password: password,
          gender: gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Registration successful! Please login now.");

      window.location.href = "login.html";
    } catch (error) {
      console.error("Registration Error:", error);

      alert("Backend server is not running!");
    }
  });
}
