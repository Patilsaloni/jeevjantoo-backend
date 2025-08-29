const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const { verifyToken } = require('../middleware/auth');

// Public
router.get('/', adoptionController.getAdoptions);
router.get('/:id', adoptionController.getAdoptionById);

// Authenticated
router.post('/', verifyToken, adoptionController.createAdoption);
router.put('/:id', verifyToken, adoptionController.updateAdoption);
router.delete('/:id', verifyToken, adoptionController.deleteAdoption);

router.post('/:id/inquiries', verifyToken, adoptionController.createInquiry);
// Only the pet owner or admin can view inquiries
router.get('/:id/inquiries', verifyToken, adoptionController.getInquiries);
router.post('/:id/mark-adopted', verifyToken, adoptionController.markAdopted);
router.post('/:id/report', verifyToken, adoptionController.reportAdoption);

module.exports = router;
