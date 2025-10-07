const express = require("express");
const app = express();
const PORT = 3000;

// Middleware for Logging
app.use((req, res, next) => {
  const timeStamp = new Date().toISOString();
  console.log(`[${timeStamp}] ${req.method} ${req.url}`);
  next();
});

// Middleware for Authentication
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or incorrect" });
  }

  const token = authHeader.split(" ")[1];
  if (token !== "mysecrettoken") {
    return res.status(403).json({ message: "Invalid token" });
  }

  next(); // Token is valid → continue
};

// Public route
app.get("/public", (req, res) => {
  res.json({ message: "This is a public route. No authentication required." });
});

// Protected route
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You have accessed a protected route with a valid Bearer token!" });
});

// Another protected route (returns user info)
app.get("/userinfo", authMiddleware, (req, res) => {
  res.json({
    username: "john_doe",
    role: "admin",
    access: "granted"
  });
});

// Server status route
app.get("/status", (req, res) => {
  res.json({ status: "Server is running fine 🚀" });
});

// Catch-all route (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
