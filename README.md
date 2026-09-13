# 🎬 Movies Website

A modern Movies Website built using HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.

The project provides user registration, secure login with Gmail OTP verification, admin management, movies listing, watch history, and login history.

---

## 🚀 Features

### 👤 User Features

- User Registration
- User Login
- Gmail OTP Verification
- Secure Password Hashing
- JWT Authentication
- Movies Listing
- Watch History
- User Profile Information

### 🔐 Admin Features

- Admin Login
- View Registered Users
- Delete Users
- View Login History
- Clear Login History
- Manage Movie Data

### 📧 OTP Security

- 6-digit OTP
- OTP sent to registered Gmail
- OTP expires after 5 minutes
- Maximum 5 incorrect OTP attempts
- 60-second OTP resend limit
- Secure OTP hashing using bcrypt

---

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js
- JWT
- bcryptjs
- Nodemailer

### Database

- MySQL

### Email Service

- Gmail SMTP

### Deployment

- GitHub Pages
- Render

---

## 📁 Project Structure

```text
movie-project/
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── login.html
├── login.js
├── login.css
│
├── register.html
├── register.js
├── register.css
│
├── otp.html
├── otp.js
├── otp.css
│
├── admin.html
├── admin.js
├── admin.css
│
└── README.md
```
