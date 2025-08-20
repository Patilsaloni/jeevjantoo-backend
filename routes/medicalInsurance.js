const express = require('express');
const router = express.Router();
const medicalInsuranceController = require('../controllers/medicalInsuranceController');

router.get('/', medicalInsuranceController.getMedicalInsurance);

module.exports = router;
