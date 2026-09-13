// =====================================================
// OTP VERIFICATION
// =====================================================

const otpForm = document.getElementById("otp-form");

const otpInput = document.getElementById("otp");

const verifyButton = document.getElementById("verify-btn");

const statusMessage = document.getElementById("status-message");

const emailDisplay = document.getElementById("email-display");

const backLoginButton = document.getElementById("back-login");

// =====================================================
// OTP SESSION
// =====================================================

let otpToken = sessionStorage.getItem("otpToken");

const otpEmail = sessionStorage.getItem("otpEmail");

// =====================================================
// CREATE RESEND UI
// =====================================================

const resendButton = document.createElement("button");

resendButton.type = "button";

resendButton.id = "resend-otp-btn";

resendButton.textContent = "Resend OTP";

resendButton.style.marginTop = "12px";

resendButton.style.width = "100%";

resendButton.style.padding = "12px";

resendButton.style.cursor = "pointer";

resendButton.style.border = "none";

resendButton.style.borderRadius = "8px";

resendButton.style.fontSize = "15px";

resendButton.style.background = "#444";

resendButton.style.color = "#fff";

resendButton.disabled = true;

// Add button after verify button

if (verifyButton) {
  verifyButton.insertAdjacentElement("afterend", resendButton);
}

// =====================================================
// SESSION CHECK
// =====================================================

if (!otpToken || !otpEmail) {
  alert("OTP session expired. Please login again.");

  window.location.href = "login.html";
}

// =====================================================
// SHOW EMAIL
// =====================================================

if (otpEmail) {
  emailDisplay.textContent = `OTP sent to: ${otpEmail}`;
}

// =====================================================
// OTP INPUT
// =====================================================

otpInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
});

// =====================================================
// COUNTDOWN
// =====================================================

let countdownInterval = null;

function startCountdown(seconds) {
  clearInterval(countdownInterval);

  let remaining = Number(seconds);

  resendButton.disabled = true;

  resendButton.textContent = `Resend OTP in ${remaining}s`;

  countdownInterval = setInterval(function () {
    remaining--;

    if (remaining <= 0) {
      clearInterval(countdownInterval);

      resendButton.disabled = false;

      resendButton.textContent = "Resend OTP";

      return;
    }

    resendButton.textContent = `Resend OTP in ${remaining}s`;
  }, 1000);
}

// Start initial 60 sec countdown

startCountdown(60);

// =====================================================
// VERIFY OTP
// =====================================================

if (otpForm) {
  otpForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const otp = otpInput.value.trim();

    if (!otp) {
      showStatus("Please enter the OTP.", "error");

      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      showStatus("Please enter a valid 6-digit OTP.", "error");

      return;
    }

    verifyButton.disabled = true;

    verifyButton.textContent = "Verifying...";

    showStatus("Verifying OTP...", "info");

    try {
      const response = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          otpToken: otpToken,

          otp: otp,
        }),
      });

      const data = await response.json();

      console.log("OTP VERIFY RESPONSE:", data);

      if (!response.ok) {
        showStatus(data.message || "Invalid OTP.", "error");

        verifyButton.disabled = false;

        verifyButton.textContent = "Verify OTP";

        otpInput.focus();

        // If session expired

        if (response.status === 401) {
          clearInterval(countdownInterval);

          resendButton.disabled = true;
        }

        return;
      }

      if (data.success) {
        // Save final login data

        localStorage.setItem("token", data.token);

        localStorage.setItem("currentUser", JSON.stringify(data.user));

        localStorage.setItem("isLoggedIn", "true");

        localStorage.setItem("isAdmin", "false");

        // Clear OTP session

        sessionStorage.removeItem("otpToken");

        sessionStorage.removeItem("otpEmail");

        clearInterval(countdownInterval);

        showStatus("OTP verified successfully! Login successful.", "success");

        setTimeout(function () {
          window.location.href = "index.html";
        }, 800);
      }
    } catch (error) {
      console.error("OTP VERIFY ERROR:", error);

      showStatus("Backend server is not running!", "error");

      verifyButton.disabled = false;

      verifyButton.textContent = "Verify OTP";
    }
  });
}

// =====================================================
// RESEND OTP
// =====================================================

resendButton.addEventListener("click", async function () {
  if (!otpToken) {
    alert("OTP session expired. Please login again.");

    window.location.href = "login.html";

    return;
  }

  resendButton.disabled = true;

  resendButton.textContent = "Sending OTP...";

  showStatus("Sending new OTP...", "info");

  try {
    const response = await fetch("http://localhost:5000/api/resend-otp", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        otpToken: otpToken,
      }),
    });

    const data = await response.json();

    console.log("RESEND OTP RESPONSE:", data);

    if (!response.ok) {
      showStatus(data.message || "Failed to resend OTP.", "error");

      if (data.remainingSeconds) {
        startCountdown(data.remainingSeconds);
      } else {
        resendButton.disabled = false;

        resendButton.textContent = "Resend OTP";
      }

      return;
    }

    if (data.success) {
      // IMPORTANT:
      // New OTP gets a new temporary token

      otpToken = data.otpToken;

      sessionStorage.setItem("otpToken", otpToken);

      if (data.email) {
        sessionStorage.setItem("otpEmail", data.email);

        emailDisplay.textContent = `OTP sent to: ${data.email}`;
      }

      otpInput.value = "";

      otpInput.focus();

      showStatus("New OTP has been sent to your email.", "success");

      startCountdown(data.resendAfter || 60);
    }
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);

    showStatus("Backend server is not running!", "error");

    resendButton.disabled = false;

    resendButton.textContent = "Resend OTP";
  }
});

// =====================================================
// STATUS MESSAGE
// =====================================================

function showStatus(message, type) {
  statusMessage.textContent = message;

  statusMessage.className = type;
}

// =====================================================
// BACK TO LOGIN
// =====================================================

if (backLoginButton) {
  backLoginButton.addEventListener("click", function () {
    clearInterval(countdownInterval);

    sessionStorage.removeItem("otpToken");

    sessionStorage.removeItem("otpEmail");

    window.location.href = "login.html";
  });
}
