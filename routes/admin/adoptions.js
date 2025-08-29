const express = require("express");
const router = express.Router();
const adminAdoptionsController = require("../../controllers/admin/adoptionsController");
const { verifyToken, isAdmin } = require("../../middleware/auth"); // destructured

// All routes are admin-protected
router.use([verifyToken, isAdmin]);

// Get all adoptions (optional filters)
router.get("/", adminAdoptionsController.getAllAdoptions);

// Get moderation queue
router.get("/moderation-queue", adminAdoptionsController.getModerationQueue);


// Mark as adopted
router.post("/:id/mark-adopted", adminAdoptionsController.markAsAdopted);

// Approve or reject an adoption
router.post("/:id/:action", adminAdoptionsController.approveOrRejectAdoption);


// Delete adoption
router.delete("/:id", adminAdoptionsController.deleteAdoption);

// Get pending adoption reports
router.get("/reports", adminAdoptionsController.getReports);

router.put("/report/:id", adminAdoptionsController.handleReport);

module.exports = router;
