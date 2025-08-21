// middleware/auth.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer token"

    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET || "your_secret_key", (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded; // { id, role }
        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ error: "Admin access required" });
};
