const express = require('express');
const router = express.Router();
const govtHelplineController = require('../controllers/govtHelplineController');

router.get('/', govtHelplineController.getGovtHelpline);

module.exports = router;
