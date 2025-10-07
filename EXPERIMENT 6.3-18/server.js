// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/bankDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Create a Mongoose Schema
const userSchema = new mongoose.Schema({
    name: String,
    balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// 1️⃣ Create new users
app.post("/create-users", async (req, res) => {
    try {
        const { name, balance } = req.body;
        const newUser = new User({ name, balance });
        await newUser.save();
        res.status(201).json({
            response: "User created successfully",
            user: newUser
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// 2️⃣ View all users
app.get("/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});
// 3️⃣ Get single user balance
app.get("/balance/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ name: user.name, balance: user.balance });
});
// 4️⃣ Transfer money between users
app.post("/transfer", async (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;

    if (!fromUserId || !toUserId || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const sender = await User.findById(fromUserId);
    const receiver = await User.findById(toUserId);

    if (!sender || !receiver) {
        return res.status(404).json({ message: "Sender or receiver not found" });
    }

    if (sender.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
    }

    // Update balances sequentially
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.status(200).json({
        message: `Transferred $${amount} from ${sender.name} to ${receiver.name}`,
        senderBalance: sender.balance,
        receiverBalance: receiver.balance
    });
});
// 5️⃣ Reset all balances (Admin route)
app.post("/reset", async (req, res) => {
    await User.updateMany({}, { $set: { balance: 1000 } });
    res.json({ message: "All user balances reset to $1000" });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
