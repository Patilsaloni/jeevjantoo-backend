const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/auth");
const feedingController = require("../../controllers/admin/feedingController");

// Protect all routes
router.use(verifyToken, isAdmin);

router.get("/", feedingController.getFeeding);
router.get("/:id", feedingController.getFeedingById);
router.post("/", feedingController.createFeeding);
router.put("/:id", feedingController.updateFeeding);
router.delete("/:id", feedingController.deleteFeeding);

module.exports = router;
