// =====================================================
// MOVIE WEBSITE - BACKEND SERVER
// Node.js + Express + MySQL + JWT + Gmail OTP
// =====================================================

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");

require("dotenv").config();

const db = require("./db");

const app = express();

// =====================================================
// CONFIGURATION
// =====================================================

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing in .env");
  process.exit(1);
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// =====================================================
// SERVE FRONTEND FILES
// =====================================================

app.use(express.static(path.join(__dirname, "..")));

// =====================================================
// GMAIL CONFIGURATION
// =====================================================

const gmailUser = process.env.GMAIL_USER;

const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
  ? process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "")
  : "";

if (!gmailUser) {
  console.warn("WARNING: GMAIL_USER is missing in .env");
}

if (!gmailAppPassword) {
  console.warn("WARNING: GMAIL_APP_PASSWORD is missing in .env");
}

// =====================================================
// GMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

// =====================================================
// HELPER - ESCAPE HTML
// =====================================================

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// SEND OTP EMAIL
// =====================================================

async function sendOtpEmail(user, otp) {
  const safeName = escapeHtml(user.name);

  await transporter.sendMail({
    from: `"Movies Website" <${gmailUser}>`,

    to: user.email,

    subject: "Movies Website - Your Login OTP",

    html: `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

</head>

<body style="
margin:0;
padding:0;
background:#f4f4f4;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:600px;
margin:30px auto;
background:#ffffff;
border-radius:14px;
overflow:hidden;
box-shadow:0 4px 15px rgba(0,0,0,0.10);
">

<!-- HEADER -->

<div style="
background:#111111;
padding:28px 20px;
text-align:center;
">

<h1 style="
margin:0;
color:#ffffff;
font-size:28px;
">
🎬 Movies Website
</h1>

<p style="
margin:10px 0 0;
color:#bbbbbb;
font-size:14px;
">
Your Entertainment Destination
</p>

</div>


<!-- CONTENT -->

<div style="
padding:35px 30px;
">

<h2 style="
margin-top:0;
color:#222222;
font-size:24px;
">
Hello ${safeName}! 👋
</h2>

<p style="
font-size:16px;
line-height:1.7;
color:#444444;
">

We received a request to sign in to your
<b>Movies Website</b> account.

</p>

<p style="
font-size:16px;
line-height:1.7;
color:#444444;
">

To continue with your login, please enter
the following One-Time Password (OTP):

</p>


<!-- OTP BOX -->

<div style="
margin:30px 0;
padding:25px;
background:#f7f7f7;
border:2px dashed #333333;
border-radius:12px;
text-align:center;
">

<p style="
margin:0 0 10px;
font-size:14px;
color:#777777;
">
Your Login OTP
</p>

<div style="
font-size:38px;
font-weight:bold;
letter-spacing:10px;
color:#111111;
">
${otp}
</div>

</div>


<p style="
font-size:15px;
line-height:1.7;
color:#555555;
">

⏱️ This OTP is valid for
<b>${OTP_EXPIRY_MINUTES} minutes</b>.

</p>

<p style="
font-size:15px;
line-height:1.7;
color:#555555;
">

🔐 For your security, please do not share this
OTP with anyone.

</p>

<p style="
font-size:15px;
line-height:1.7;
color:#555555;
">

If you did not request this login, you can safely
ignore this email. Your account will remain secure.

</p>


<hr style="
border:0;
border-top:1px solid #eeeeee;
margin:30px 0;
">


<p style="
font-size:14px;
line-height:1.6;
color:#777777;
">

Thank you for using <b>Movies Website</b>.

Enjoy discovering and watching your favorite movies! 🎬🍿

</p>

</div>


<!-- FOOTER -->

<div style="
background:#f7f7f7;
padding:20px;
text-align:center;
">

<p style="
margin:0;
font-size:13px;
color:#888888;
">
© ${new Date().getFullYear()} Movies Website
</p>

<p style="
margin:7px 0 0;
font-size:12px;
color:#aaaaaa;
">
This is an automated email. Please do not reply.
</p>

</div>

</div>

</body>

</html>
`,
  });
}

// =====================================================
// CREATE OTP
// =====================================================

async function createOtp(user) {
  // Generate 6 digit OTP

  const otp = crypto.randomInt(100000, 1000000).toString();

  // Hash OTP

  const otpHash = await bcrypt.hash(otp, 10);

  // Expiry

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete old OTPs

  await db.execute("DELETE FROM otp_codes WHERE user_id = ?", [user.id]);

  // Save OTP

  await db.execute(
    `INSERT INTO otp_codes
    (
      user_id,
      otp_hash,
      expires_at,
      attempts,
      verified
    )
    VALUES (?, ?, ?, 0, FALSE)`,
    [user.id, otpHash, expiresAt],
  );

  // Temporary token

  const otpToken = jwt.sign(
    {
      userId: user.id,
      purpose: "otp-verification",
    },

    JWT_SECRET,

    {
      expiresIn: "5m",
    },
  );

  // Send mail

  await sendOtpEmail(user, otp);

  return {
    otpToken,
    email: user.email,
  };
}

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Movies Website Backend is running!",
  });
});

// =====================================================
// FRONTEND ROUTES
// =====================================================

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "register.html"));
});

app.get("/otp", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "otp.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "admin.html"));
});

// =====================================================
// REGISTER
// =====================================================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, mobile, password, gender } = req.body;

    if (!name || !email || !mobile || !password || !gender) {
      return res.status(400).json({
        success: false,

        message: "Please fill all fields!",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,

        message: "Please enter a valid email address!",
      });
    }

    // Check existing user

    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",

      [cleanEmail],
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,

        message: "User already registered!",
      });
    }

    // Hash password

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user

    await db.execute(
      `INSERT INTO users
      (
        name,
        email,
        mobile,
        password,
        gender
      )
      VALUES (?, ?, ?, ?, ?)`,

      [name.trim(), cleanEmail, mobile.trim(), hashedPassword, gender],
    );

    return res.status(201).json({
      success: true,

      message: "Registration successful!",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Registration failed. Please try again.",
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    if (!email || !password || !loginType) {
      return res.status(400).json({
        success: false,

        message: "Please fill all fields!",
      });
    }

    if (loginType !== "user" && loginType !== "admin") {
      return res.status(400).json({
        success: false,

        message: "Invalid login type!",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",

      [cleanEmail],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,

        message: "Invalid email or password!",
      });
    }

    const user = users[0];

    // =================================================
    // ROLE CHECK
    // =================================================

    if (loginType === "admin" && user.role !== "admin") {
      return res.status(403).json({
        success: false,

        message: "You are not an admin!",
      });
    }

    if (loginType === "user" && user.role !== "user") {
      return res.status(403).json({
        success: false,

        message: "Please use admin login!",
      });
    }

    // =================================================
    // PASSWORD CHECK
    // =================================================

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,

        message: "Invalid email or password!",
      });
    }

    // =================================================
    // ADMIN LOGIN
    // NO OTP
    // =================================================

    if (loginType === "admin") {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },

        JWT_SECRET,

        {
          expiresIn: "1d",
        },
      );

      await db.execute(
        `INSERT INTO login_history
        (
          user_id,
          name,
          email
        )
        VALUES (?, ?, ?)`,

        [user.id, user.name, user.email],
      );

      return res.json({
        success: true,

        otpRequired: false,

        message: "Admin login successful!",

        token: token,

        user: {
          id: user.id,

          name: user.name,

          email: user.email,

          mobile: user.mobile,

          gender: user.gender,

          role: user.role,
        },
      });
    }

    // =================================================
    // USER LOGIN
    // OTP REQUIRED
    // =================================================

    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({
        success: false,

        message: "Gmail OTP is not configured. Please check .env.",
      });
    }

    // =================================================
    // 60 SECOND RATE LIMIT
    // =================================================

    const [recentOtpRows] = await db.execute(
      `SELECT
          id,
          created_at
         FROM otp_codes
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,

      [user.id],
    );

    if (recentOtpRows.length > 0) {
      const lastOtp = recentOtpRows[0];

      const createdAt = new Date(lastOtp.created_at);

      const elapsedSeconds = Math.floor(
        (Date.now() - createdAt.getTime()) / 1000,
      );

      if (elapsedSeconds < OTP_RESEND_SECONDS) {
        const remainingSeconds = OTP_RESEND_SECONDS - elapsedSeconds;

        return res.status(429).json({
          success: false,

          otpRequired: true,

          rateLimited: true,

          remainingSeconds: remainingSeconds,

          message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        });
      }
    }

    // =================================================
    // CREATE + SEND OTP
    // =================================================

    const result = await createOtp(user);

    console.log(`OTP sent successfully to ${user.email}`);

    return res.json({
      success: true,

      otpRequired: true,

      message: "OTP sent to your registered email!",

      otpToken: result.otpToken,

      email: result.email,

      resendAfter: OTP_RESEND_SECONDS,
    });
  } catch (error) {
    console.error("LOGIN / OTP ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to send OTP. Please try again.",
    });
  }
});

// =====================================================
// RESEND OTP
// =====================================================

app.post("/api/resend-otp", async (req, res) => {
  try {
    const { otpToken } = req.body;

    if (!otpToken) {
      return res.status(400).json({
        success: false,

        message: "OTP session is required.",
      });
    }

    // Verify temporary token

    let decoded;

    try {
      decoded = jwt.verify(otpToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,

        message: "OTP session expired. Please login again.",
      });
    }

    if (decoded.purpose !== "otp-verification") {
      return res.status(401).json({
        success: false,

        message: "Invalid OTP session.",
      });
    }

    const userId = decoded.userId;

    // Get user

    const [users] = await db.execute(
      "SELECT * FROM users WHERE id = ?",

      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,

        message: "User not found.",
      });
    }

    const user = users[0];

    // =================================================
    // 60 SECOND RESEND LIMIT
    // =================================================

    const [otpRows] = await db.execute(
      `SELECT
            id,
            created_at
           FROM otp_codes
           WHERE user_id = ?
           ORDER BY id DESC
           LIMIT 1`,

      [userId],
    );

    if (otpRows.length > 0) {
      const lastOtp = otpRows[0];

      const createdAt = new Date(lastOtp.created_at);

      const elapsedSeconds = Math.floor(
        (Date.now() - createdAt.getTime()) / 1000,
      );

      if (elapsedSeconds < OTP_RESEND_SECONDS) {
        const remainingSeconds = OTP_RESEND_SECONDS - elapsedSeconds;

        return res.status(429).json({
          success: false,

          rateLimited: true,

          remainingSeconds: remainingSeconds,

          message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        });
      }
    }

    // =================================================
    // CREATE NEW OTP
    // =================================================

    const result = await createOtp(user);

    console.log(`OTP resent successfully to ${user.email}`);

    return res.json({
      success: true,

      message: "New OTP sent successfully!",

      otpRequired: true,

      otpToken: result.otpToken,

      email: result.email,

      resendAfter: OTP_RESEND_SECONDS,
    });
  } catch (error) {
    console.error("RESEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to resend OTP. Please try again.",
    });
  }
});

// =====================================================
// VERIFY OTP
// =====================================================

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { otpToken, otp } = req.body;

    if (!otpToken || !otp) {
      return res.status(400).json({
        success: false,

        message: "OTP is required!",
      });
    }

    if (!/^\d{6}$/.test(otp.toString())) {
      return res.status(400).json({
        success: false,

        message: "OTP must be 6 digits!",
      });
    }

    // =================================================
    // VERIFY TEMP TOKEN
    // =================================================

    let decoded;

    try {
      decoded = jwt.verify(otpToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,

        message: "OTP session expired. Please login again.",
      });
    }

    if (decoded.purpose !== "otp-verification") {
      return res.status(401).json({
        success: false,

        message: "Invalid OTP session!",
      });
    }

    const userId = decoded.userId;

    // =================================================
    // GET LATEST OTP
    // =================================================

    const [otpRows] = await db.execute(
      `SELECT *
           FROM otp_codes
           WHERE user_id = ?
           ORDER BY id DESC
           LIMIT 1`,

      [userId],
    );

    if (otpRows.length === 0) {
      return res.status(400).json({
        success: false,

        message: "OTP not found. Please login again.",
      });
    }

    const otpRecord = otpRows[0];

    // Already verified

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,

        message: "OTP already used!",
      });
    }

    // Maximum attempts

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,

        message: "Too many wrong attempts. Please login again.",
      });
    }

    // =================================================
    // CHECK EXPIRY
    // =================================================

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,

        message: "OTP expired. Please login again.",
      });
    }

    // =================================================
    // CHECK OTP
    // =================================================

    const otpMatch = await bcrypt.compare(
      otp.toString(),

      otpRecord.otp_hash,
    );

    if (!otpMatch) {
      await db.execute(
        `UPDATE otp_codes
           SET attempts = attempts + 1
           WHERE id = ?`,

        [otpRecord.id],
      );

      return res.status(401).json({
        success: false,

        message: "Invalid OTP!",
      });
    }

    // =================================================
    // MARK VERIFIED
    // =================================================

    await db.execute(
      `UPDATE otp_codes
         SET verified = TRUE
         WHERE id = ?`,

      [otpRecord.id],
    );

    // =================================================
    // GET USER
    // =================================================

    const [users] = await db.execute(
      "SELECT * FROM users WHERE id = ?",

      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,

        message: "User not found!",
      });
    }

    const user = users[0];

    // =================================================
    // CREATE FINAL TOKEN
    // =================================================

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },

      JWT_SECRET,

      {
        expiresIn: "1d",
      },
    );

    // =================================================
    // LOGIN HISTORY
    // =================================================

    await db.execute(
      `INSERT INTO login_history
        (
          user_id,
          name,
          email
        )
        VALUES (?, ?, ?)`,

      [user.id, user.name, user.email],
    );

    // =================================================
    // SUCCESS
    // =================================================

    return res.json({
      success: true,

      message: "OTP verified! Login successful.",

      token: token,

      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        mobile: user.mobile,

        gender: user.gender,

        role: user.role,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "OTP verification failed.",
    });
  }
});

// =====================================================
// ADMIN - GET USERS
// =====================================================

app.get("/api/admin/users", async (req, res) => {
  try {
    const [users] = await db.execute(`

          SELECT
            id,
            name,
            email,
            mobile,
            gender,
            role,
            registered_at

          FROM users

          ORDER BY id DESC

        `);

    return res.json({
      success: true,

      users: users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load users",
    });
  }
});

// =====================================================
// ADMIN - LOGIN HISTORY
// =====================================================

app.get("/api/admin/login-history", async (req, res) => {
  try {
    const [history] = await db.execute(`

          SELECT
            id,
            user_id,
            name,
            email,
            login_at

          FROM login_history

          ORDER BY id DESC

        `);

    return res.json({
      success: true,

      history: history,
    });
  } catch (error) {
    console.error("LOGIN HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load login history",
    });
  }
});

// =====================================================
// ADMIN - CLEAR LOGIN HISTORY
// =====================================================

app.delete("/api/admin/login-history", async (req, res) => {
  try {
    await db.execute("DELETE FROM login_history");

    return res.json({
      success: true,

      message: "Login history cleared successfully!",
    });
  } catch (error) {
    console.error("CLEAR LOGIN HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to clear login history.",
    });
  }
});

// =====================================================
// ADMIN - DELETE USER
// =====================================================

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid user ID",
      });
    }

    const [result] = await db.execute(
      "DELETE FROM users WHERE id = ?",

      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    return res.json({
      success: true,

      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to delete user",
    });
  }
});

// =====================================================
// MOVIES
// =====================================================

app.get("/api/movies", async (req, res) => {
  try {
    const [movies] = await db.execute("SELECT * FROM movies ORDER BY id");

    return res.json({
      success: true,

      movies: movies,
    });
  } catch (error) {
    console.error("MOVIES ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load movies",
    });
  }
});

// =====================================================
// TEST GMAIL
// =====================================================

app.get("/api/test-email", async (req, res) => {
  try {
    if (!gmailUser || !gmailAppPassword) {
      return res.status(500).json({
        success: false,

        message: "GMAIL_USER or GMAIL_APP_PASSWORD is missing in .env",
      });
    }

    await transporter.verify();

    return res.json({
      success: true,

      message: "Gmail SMTP connection is working!",
    });
  } catch (error) {
    console.error("GMAIL SMTP ERROR:", error);

    return res.status(500).json({
      success: false,

      message:
        "Gmail SMTP authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD.",
    });
  }
});

// =====================================================
// API 404
// =====================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,

    message: "API endpoint not found",
  });
});

// =====================================================
// SERVER START
// =====================================================

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");

  console.log("🎬 MOVIES WEBSITE SERVER");

  console.log("======================================");

  console.log(`Backend: http://localhost:${PORT}`);

  console.log(`Login:   http://localhost:${PORT}/login.html`);

  console.log(`Register:http://localhost:${PORT}/register.html`);

  console.log(`OTP:     http://localhost:${PORT}/otp.html`);

  console.log("======================================");

  console.log("");
});
