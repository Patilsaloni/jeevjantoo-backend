// middleware/auth.js
const jwt = require('jsonwebtoken');

// Verify token and check expiration
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET || "your_secret_key", (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(403).json({ error: "Token expired" });
            }
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = decoded; // { id, role }
        next();
    });
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ error: "Admin access required" });
};

// Generate JWT token for user/admin
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },       // payload
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "12h" }                   // token valid for 12 hours
    );
};
