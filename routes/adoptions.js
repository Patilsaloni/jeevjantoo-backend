// routes/adoptions.js
const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', adoptionController.getAdoptions);
router.get('/:id', adoptionController.getAdoptionById);

// Routes requiring logged-in users
router.post('/', verifyToken, adoptionController.createAdoption);
router.put('/:id', verifyToken, adoptionController.updateAdoption);
router.delete('/:id', verifyToken, adoptionController.deleteAdoption);
router.post('/:id/inquiries', verifyToken, adoptionController.createInquiry);
router.post('/:id/mark-adopted', verifyToken, adoptionController.markAdopted);
router.post('/:id/report', verifyToken, adoptionController.reportAdoption);

// Admin-only actions
router.get('/moderation-queue', verifyToken, isAdmin, adoptionController.getModerationQueue);
router.post('/:id/review', verifyToken, isAdmin, adoptionController.reviewAdoption);

module.exports = router;
