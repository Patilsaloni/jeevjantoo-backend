const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/auth");
const clinicsAdminController = require("../../controllers/admin/clinicsController");

// Protect all routes
router.use(verifyToken, isAdmin);

router.get("/", clinicsAdminController.getClinics);
router.post("/", clinicsAdminController.createClinic);
router.put("/:id", clinicsAdminController.updateClinic);
router.delete("/:id", clinicsAdminController.deleteClinic);

module.exports = router;
