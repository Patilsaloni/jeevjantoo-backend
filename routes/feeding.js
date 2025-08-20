const express = require('express');
const router = express.Router();
const feedingController = require('../controllers/feedingController');

router.get('/', feedingController.getFeeding);

module.exports = router;
