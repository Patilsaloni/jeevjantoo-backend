const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

// GET /api/v1/events
router.get('/', eventsController.getEvents);

module.exports = router;
