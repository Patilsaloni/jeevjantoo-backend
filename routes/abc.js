const express = require('express');
const router = express.Router();
const abcController = require('../controllers/abcController');

router.get('/', abcController.getABC);

module.exports = router;
