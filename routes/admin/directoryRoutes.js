const express = require("express");
const router = express.Router();
const { getReports, handleReport } = require("../../controllers/admin/directoryController");
const { verifyToken, isAdmin } = require("../../middleware/auth");

// Admin: Get all reports
router.get("/reports", verifyToken, isAdmin, getReports);

// Admin: Handle a report
router.put("/report/:id", verifyToken, isAdmin, handleReport);

module.exports = router;
