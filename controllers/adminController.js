const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");          // needed for password comparison
const db = require("../db");                // your MySQL connection
const util = require("util");

const query = util.promisify(db.query).bind(db); // convert db.query to promise
bcrypt.hash("admin123", 10).then(hash => console.log(hash));

// ---------------- Admin Login ----------------
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Fetch admin from DB
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ error: "Admin not found" });

    const user = users[0];

    // Check role
    if (user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Admin login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
