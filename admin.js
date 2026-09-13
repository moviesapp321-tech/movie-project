// ==========================================
// ADMIN PANEL
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  loadAdminData();
  setupButtons();
});

// ==========================================
// LOAD ADMIN DATA
// ==========================================

async function loadAdminData() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login as admin!");
      window.location.href = "login.html";
      return;
    }

    // ==========================================
    // LOAD USERS
    // ==========================================

    const usersResponse = await fetch("http://localhost:5000/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const usersData = await usersResponse.json();

    if (!usersResponse.ok) {
      alert(usersData.message || "Failed to load users");
      return;
    }

    // ==========================================
    // LOAD LOGIN HISTORY
    // ==========================================

    const loginResponse = await fetch(
      "http://localhost:5000/api/admin/login-history",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      alert(loginData.message || "Failed to load login history");
      return;
    }

    // ==========================================
    // DISPLAY DATA
    // ==========================================

    displayUsers(usersData.users || []);

    displayLoginHistory(loginData.history || []);

    // Total users
    const totalUsers = document.getElementById("total-users");

    if (totalUsers) {
      totalUsers.textContent = usersData.users.length;
    }

    // Total logins
    const totalLogins = document.getElementById("total-logins");

    if (totalLogins) {
      totalLogins.textContent = loginData.history.length;
    }
  } catch (error) {
    console.error("LOAD ADMIN DATA ERROR:", error);

    alert("Backend server is not running!");
  }
}

// ==========================================
// DISPLAY USERS
// ==========================================

function displayUsers(users) {
  const container = document.getElementById("registered-users");

  if (!container) return;

  container.innerHTML = "";

  if (!users.length) {
    container.innerHTML = `<p class="empty-msg">
        No registered users.
      </p>`;

    return;
  }

  users.forEach((user) => {
    const card = document.createElement("div");

    card.className = "admin-card";

    card.innerHTML = `
      <p>
        <strong>Name:</strong>
        ${escapeHtml(user.name)}
      </p>

      <p>
        <strong>Email:</strong>
        ${escapeHtml(user.email)}
      </p>

      <p>
        <strong>Mobile:</strong>
        ${escapeHtml(user.mobile)}
      </p>

      <p>
        <strong>Gender:</strong>
        ${escapeHtml(user.gender)}
      </p>

      <p>
        <strong>Role:</strong>
        ${escapeHtml(user.role)}
      </p>

      <p>
        <strong>Registered At:</strong>
        ${formatDate(user.registered_at)}
      </p>

      <button
        class="delete-btn"
        onclick="deleteUser(${user.id})">
        Delete User
      </button>
    `;

    container.appendChild(card);
  });
}

// ==========================================
// DISPLAY LOGIN HISTORY
// ==========================================

function displayLoginHistory(history) {
  const container = document.getElementById("login-history");

  if (!container) return;

  container.innerHTML = "";

  if (!history.length) {
    container.innerHTML = `<p class="empty-msg">
        No login history.
      </p>`;

    return;
  }

  history.forEach((item) => {
    const card = document.createElement("div");

    card.className = "admin-card";

    card.innerHTML = `
      <p>
        <strong>Name:</strong>
        ${escapeHtml(item.name)}
      </p>

      <p>
        <strong>Email:</strong>
        ${escapeHtml(item.email)}
      </p>

      <p>
        <strong>Login At:</strong>
        ${formatDate(item.login_at)}
      </p>
    `;

    container.appendChild(card);
  });
}

// ==========================================
// DELETE USER
// ==========================================

async function deleteUser(id) {
  const confirmDelete = confirm("Are you sure you want to delete this user?");

  if (!confirmDelete) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Admin session expired. Please login again.");

      window.location.href = "login.html";

      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/admin/users/${id}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete user");

      return;
    }

    alert("User deleted successfully!");

    // Reload admin data
    loadAdminData();
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    alert("Backend server is not running!");
  }
}

// ==========================================
// CLEAR LOGIN HISTORY
// ==========================================

async function clearLoginHistory() {
  const confirmClear = confirm(
    "Are you sure you want to clear ALL login history?",
  );

  if (!confirmClear) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Admin session expired. Please login again.");

      window.location.href = "login.html";

      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/admin/login-history",
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to clear login history");

      return;
    }

    alert("Login history cleared successfully!");

    // Clear UI immediately
    const historyContainer = document.getElementById("login-history");

    if (historyContainer) {
      historyContainer.innerHTML = `<p class="empty-msg">
          No login history.
        </p>`;
    }

    // Update counter
    const totalLogins = document.getElementById("total-logins");

    if (totalLogins) {
      totalLogins.textContent = "0";
    }
  } catch (error) {
    console.error("CLEAR LOGIN HISTORY ERROR:", error);

    alert("Backend server is not running!");
  }
}

// ==========================================
// BUTTONS
// ==========================================

function setupButtons() {
  // ========================================
  // LOGOUT
  // ========================================

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");

      localStorage.removeItem("currentUser");

      localStorage.removeItem("isLoggedIn");

      localStorage.removeItem("isAdmin");

      alert("Admin logged out successfully!");

      window.location.href = "login.html";
    });
  }

  // ========================================
  // CLEAR LOGIN HISTORY
  // ========================================

  const clearLoginHistoryBtn = document.getElementById("clearLoginHistory");

  if (clearLoginHistoryBtn) {
    clearLoginHistoryBtn.addEventListener("click", clearLoginHistory);
  }

  // ========================================
  // CLEAR WATCH HISTORY
  // ========================================

  const clearWatchHistory = document.getElementById("clearWatchHistory");

  if (clearWatchHistory) {
    clearWatchHistory.addEventListener("click", () => {
      const confirmClear = confirm(
        "Are you sure you want to clear watch history?",
      );

      if (!confirmClear) {
        return;
      }

      localStorage.removeItem("watchHistory");

      const watchContainer = document.getElementById("watch-history");

      if (watchContainer) {
        watchContainer.innerHTML = `<p class="empty-msg">
              No watch history.
            </p>`;
      }

      const totalWatches = document.getElementById("total-watches");

      if (totalWatches) {
        totalWatches.textContent = "0";
      }

      alert("Watch history cleared successfully!");
    });
  }
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
