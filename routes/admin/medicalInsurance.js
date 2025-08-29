const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/medicalInsuranceController');
const { verifyToken, isAdmin } = require('../../middleware/auth');

// All routes now require admin access
router.get('/', verifyToken, isAdmin, controller.getMedicalInsurance);
router.get('/:id', verifyToken, isAdmin, controller.getMedicalInsuranceById);
router.post('/', verifyToken, isAdmin, controller.createMedicalInsurance);
router.put('/:id', verifyToken, isAdmin, controller.updateMedicalInsurance);
router.delete('/:id', verifyToken, isAdmin, controller.deleteMedicalInsurance);

module.exports = router;
