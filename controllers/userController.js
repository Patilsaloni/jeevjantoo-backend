const db = require('../db');
require('dotenv').config(); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret key for JWT (store in .env in production)
const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !password || (!email && !phone)) {
        return res.status(400).json({ error: "Name, Email/Phone and password required" });
    }

    try {
        // Password hash karna
        const hashedPassword = await bcrypt.hash(password, 10);

        // DB me insert
        const query = "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)";
        db.query(query, [name, email, phone, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error", details: err.sqlMessage });
            res.json({ message: "User registered successfully", userId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};


// Login route
exports.login = (req, res) => {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
        return res.status(400).json({ error: "Email/Phone and password required" });
    }

    const query = email 
        ? "SELECT * FROM users WHERE email = ?" 
        : "SELECT * FROM users WHERE phone = ?";

    const param = email ? email : phone;

    db.query(query, [param], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!results.length) return res.status(404).json({ error: "User not found" });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        });
    });
};


// Get all users
exports.getUsers = (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ data: results });
    });
};

// Get user by ID
exports.getUserById = (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ data: results[0] });
    });
};
