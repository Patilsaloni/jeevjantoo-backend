const express = require('express');
const router = express.Router();
const boardingSpaController = require('../controllers/boardingSpaController');

router.get('/', boardingSpaController.getBoardingSpa);

module.exports = router;
