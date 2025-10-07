const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const SECRET_KEY = "supersecretkey"; //JWT tokens

//database
let users = {
  user1: { password: "password123", balance: 1000, transactions: [] },
  user2: { password: "hello123", balance: 2000, transactions: [] }
};
// Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or incorrect" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = decoded.username;
    next();
  });
}
// Routes
// Login Route → Generates JWT
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// Protected route → Check balance
app.get("/balance", verifyToken, (req, res) => {
  const user = users[req.user];
  res.json({ balance: user.balance });
});

// Deposit money
app.post("/deposit", verifyToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid deposit amount" });

  users[req.user].balance += amount;
  users[req.user].transactions.push({ type: "deposit", amount, date: new Date().toISOString() });

  res.json({
    message: `Deposited $${amount}`,
    newBalance: users[req.user].balance
  });
});

// Withdraw money
app.post("/withdraw", verifyToken, (req, res) => {
  const { amount } = req.body;
  const user = users[req.user];

  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid withdrawal amount" });
  if (amount > user.balance) return res.status(400).json({ message: "Insufficient balance" });

  user.balance -= amount;
  user.transactions.push({ type: "withdraw", amount, date: new Date().toISOString() });

  res.json({
    message: `Withdrew $${amount}`,
    newBalance: user.balance
  });
});
// Transfer money between users
app.post("/transfer", verifyToken, (req, res) => {
  const { to, amount } = req.body;
  const sender = users[req.user];

  if (!users[to]) return res.status(404).json({ message: "Recipient not found" });
  if (amount <= 0) return res.status(400).json({ message: "Invalid transfer amount" });
  if (sender.balance < amount) return res.status(400).json({ message: "Insufficient funds" });

  sender.balance -= amount;
  users[to].balance += amount;

  sender.transactions.push({ type: "transfer", to, amount, date: new Date().toISOString() });
  users[to].transactions.push({ type: "received", from: req.user, amount, date: new Date().toISOString() });

  res.json({
    message: `Transferred $${amount} to ${to}`,
    newBalance: sender.balance
  });
});

// View all transactions
app.get("/transactions", verifyToken, (req, res) => {
  res.json({
    user: req.user,
    transactions: users[req.user].transactions
  });
});

// Logout route (token invalidation simulation)
app.post("/logout", verifyToken, (req, res) => {
  res.json({ message: `User ${req.user} logged out successfully (token will expire soon)` });
});

// Server health check
app.get("/status", (req, res) => {
  res.json({ status: "Banking API server is running fine 🚀" });
});

// Catch-all route
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
