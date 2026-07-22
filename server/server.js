require("dotenv").config();

const express = require("express");
const passport = require("passport");
const { connectDB, getDB } = require("./config/database");
const authRoutes = require("./routers/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Configure Passport
require("./config/passport")(passport);
app.use(passport.initialize());

// Authentication routes
app.use("/api", authRoutes);

// 1. Test Route
app.get("/api/test", async (req, res) => {
    try {
        const db = getDB();
        const collections = await db.listCollections().toArray();
        res.json(collections);
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({ error: "Failed to fetch collections" });
    }
});

// 2. CREATE: Add a new user
app.post("/api/users", async (req, res) => {
    try {
        const db = getDB();
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        const newUser = {
            name,
            email,
            createdAt: new Date()
        };

        const result = await db.collection("Users").insertOne(newUser);

        res.status(201).json({
            message: "User created successfully!",
            userId: result.insertedId
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// 3. READ: Get all users
app.get("/api/users", async (req, res) => {
    try {
        const db = getDB();
        const users = await db.collection("Users").find().toArray();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// 4. CREATE: Add a new receipt
app.post("/api/receipts", async (req, res) => {
    try {
        const db = getDB();
        const { title, totalAmount, paidByUserId } = req.body;

        if (!title || totalAmount === undefined || !paidByUserId) {
            return res.status(400).json({
                error: "Title, totalAmount, and paidByUserId are required"
            });
        }

        const newReceipt = {
            title,
            totalAmount: parseFloat(totalAmount),
            paidByUserId,
            date: new Date(),
            createdAt: new Date()
        };

        const result = await db.collection("Receipts").insertOne(newReceipt);

        res.status(201).json({
            message: "Receipt logged successfully!",
            receiptId: result.insertedId
        });
    } catch (error) {
        console.error("Error creating receipt:", error);
        res.status(500).json({ error: "Failed to create receipt" });
    }
});

// 5. READ: Get all receipts
app.get("/api/receipts", async (req, res) => {
    try {
        const db = getDB();
        const receipts = await db.collection("Receipts").find().toArray();
        res.json(receipts);
    } catch (error) {
        console.error("Error fetching receipts:", error);
        res.status(500).json({ error: "Failed to fetch receipts" });
    }
});

// 6. CREATE: Add an item to a receipt
app.post("/api/receipt-items", async (req, res) => {
    try {
        const db = getDB();
        const { receiptId, itemName, price } = req.body;

        if (!receiptId || !itemName || price === undefined) {
            return res.status(400).json({
                error: "receiptId, itemName, and price are required"
            });
        }

        const newItem = {
            receiptId,
            itemName,
            price: parseFloat(price),
            createdAt: new Date()
        };

        const result = await db.collection("ReceiptItems").insertOne(newItem);

        res.status(201).json({
            message: "Receipt item added successfully!",
            itemId: result.insertedId
        });
    } catch (error) {
        console.error("Error adding receipt item:", error);
        res.status(500).json({ error: "Failed to add receipt item" });
    }
});

// 7. READ: Get all items for a specific receipt
app.get("/api/receipt-items/:receiptId", async (req, res) => {
    try {
        const db = getDB();
        const { receiptId } = req.params;

        const items = await db
            .collection("ReceiptItems")
            .find({ receiptId })
            .toArray();

        res.json(items);
    } catch (error) {
        console.error("Error fetching receipt items:", error);
        res.status(500).json({ error: "Failed to fetch receipt items" });
    }
});

// 8. CREATE: Add a participant to a receipt
app.post("/api/receipt-participants", async (req, res) => {
    try {
        const db = getDB();
        const { receiptId, userId, balanceOwed } = req.body;

        if (!receiptId || !userId || balanceOwed === undefined) {
            return res.status(400).json({
                error: "receiptId, userId, and balanceOwed are required"
            });
        }

        const newParticipant = {
            receiptId,
            userId,
            balanceOwed: parseFloat(balanceOwed),
            createdAt: new Date()
        };

        const result = await db
            .collection("ReceiptParticipants")
            .insertOne(newParticipant);

        res.status(201).json({
            message: "Participant added to receipt!",
            participantId: result.insertedId
        });
    } catch (error) {
        console.error("Error adding participant:", error);
        res.status(500).json({ error: "Failed to add participant" });
    }
});

// 9. READ: Get all participants for a specific receipt
app.get("/api/receipt-participants/:receiptId", async (req, res) => {
    try {
        const db = getDB();
        const { receiptId } = req.params;

        const participants = await db
            .collection("ReceiptParticipants")
            .find({ receiptId })
            .toArray();

        res.json(participants);
    } catch (error) {
        console.error("Error fetching receipt participants:", error);
        res.status(500).json({
            error: "Failed to fetch receipt participants"
        });
    }
});

// Connect to Database and start Server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database connection failed", err);
    });