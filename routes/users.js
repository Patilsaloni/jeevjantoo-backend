// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);  
router.post('/login', userController.login);        

// Protected routes (admin only)
router.get('/', verifyToken, isAdmin, userController.getUsers);           
router.get('/:id', verifyToken, isAdmin, userController.getUserById); 

module.exports = router;
