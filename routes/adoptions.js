const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const { verifyToken, isAdmin } = require('../middleware/auth');


router.get('/', adoptionController.getAdoptions);
router.get('/moderation-queue', adoptionController.getModerationQueue);
router.get('/:id', adoptionController.getAdoptionById);
router.post('/', adoptionController.createAdoption);
router.put('/:id', adoptionController.updateAdoption);
router.delete('/:id', adoptionController.deleteAdoption);
router.post('/:id/inquiries', adoptionController.createInquiry);
router.post('/:id/mark-adopted', adoptionController.markAdopted);
router.post("/:id/report", adoptionController.reportAdoption);
router.post('/:id/review', adoptionController.reviewAdoption);


// Public routes (no auth needed)
// router.get('/', adoptionController.getAdoptions);
// router.get('/moderation-queue', verifyToken, isAdmin, adoptionController.getModerationQueue); // admin only
// router.get('/:id', adoptionController.getAdoptionById);

// // Routes requiring logged-in users
// router.post('/', verifyToken, adoptionController.createAdoption);
// router.put('/:id', verifyToken, adoptionController.updateAdoption);
// router.delete('/:id', verifyToken, adoptionController.deleteAdoption);
// router.post('/:id/inquiries', verifyToken, adoptionController.createInquiry);
// router.post('/:id/mark-adopted', verifyToken, adoptionController.markAdopted);
// router.post('/:id/report', verifyToken, adoptionController.reportAdoption);

// // Admin-only actions
// router.post('/:id/review', verifyToken, isAdmin, adoptionController.reviewAdoption);

module.exports = router;
