const admin = require("../firebase");  // Firebase Admin SDK
const db = require("../db");           // MySQL connection
const bcrypt = require("bcrypt");
const util = require("util");
const { generateToken } = require("../middleware/auth");
const query = util.promisify(db.query).bind(db);

// ----------------- Registration -----------------
exports.registerUser = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ error: "Name, phone, and password are required" });
        }

        const existingUser = await query("SELECT * FROM users WHERE phone = ?", [phone]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Phone number already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await query(
            "INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)",
            [name, phone, email || null, hashedPassword]
        );

        res.json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// ----------------- Firebase OTP Login -----------------
exports.loginUser = async (req, res) => {
    const { idToken } = req.body; // idToken from Firebase signInWithPhoneNumber

    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    try {
        // Verify idToken with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const phone = decodedToken.phone_number;

        if (!phone) return res.status(400).json({ error: "Phone missing in token" });

        // Check if user exists in DB
        let users = await query("SELECT * FROM users WHERE phone = ?", [phone]);
        let user;
        if (users.length === 0) {
            const result = await query("INSERT INTO users (phone, role) VALUES (?, ?)", [phone, "user"]);
            user = { id: result.insertId, phone, role: "user" };
        } else {
            user = users[0];
        }

        // Generate backend JWT
        const backendToken = generateToken({ id: user.id, role: user.role });

        res.json({
            message: "Login successful",
            token: backendToken,
            user
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(401).json({ error: "Invalid or expired OTP" });
    }
};
