const express = require('express');
const router = express.Router();
const govtHelplineController = require('../../controllers/admin/govtHelplineController');
const { verifyToken, isAdmin } = require('../../middleware/auth');

// Protect all admin routes
router.use(verifyToken, isAdmin);

router.get("/", govtHelplineController.getHelplines);
router.get("/:id", govtHelplineController.getHelplineById);
router.post("/", govtHelplineController.createHelpline);
router.put("/:id", govtHelplineController.updateHelpline);
router.delete("/:id", govtHelplineController.deleteHelpline);

module.exports = router;
