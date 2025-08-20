// routes/ambulances.js
const express = require('express');
const router = express.Router();
const ambulancesController = require('../controllers/ambulanceController');

router.get('/', ambulancesController.getAmbulances);

module.exports = router;
