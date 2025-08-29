const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/auth");
const eventsController = require("../../controllers/admin/eventsController");

// Protect all routes
router.use(verifyToken, isAdmin);

router.get("/", eventsController.getEvents);
router.post("/", eventsController.createEvent);
router.put("/:id", eventsController.updateEvent);
router.delete("/:id", eventsController.deleteEvent);

module.exports = router;
