const express = require('express');
const router = express.Router();
const ngosController = require('../controllers/ngosController');

router.get('/', ngosController.getNgos);

module.exports = router;
