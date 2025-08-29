const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/auth");
const ambulanceController = require("../../controllers/admin/ambulanceController");

// Protect all routes
router.use(verifyToken, isAdmin);

router.get("/", ambulanceController.getAmbulances);
router.post("/", ambulanceController.createAmbulance);
router.put("/:id", ambulanceController.updateAmbulance);
router.delete("/:id", ambulanceController.deleteAmbulance);

module.exports = router;
