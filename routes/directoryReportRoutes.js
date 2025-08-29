const express = require("express");
const router = express.Router();
const { createReport } = require("../controllers/directoryReportController");
const { verifyToken } = require("../middleware/auth"); // ✅ correct

// Create a report
router.post("/:type/:id/report", verifyToken, createReport);

module.exports = router;
