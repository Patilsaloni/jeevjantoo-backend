const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// Protected routes example (admin only)
// router.get('/', verifyToken, isAdmin, userController.getUsers);

module.exports = router;
