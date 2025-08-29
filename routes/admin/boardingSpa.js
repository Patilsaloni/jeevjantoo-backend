const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/auth");
const boardingSpaController = require("../../controllers/admin/boardingSpaController");

// Protect all routes
router.use(verifyToken, isAdmin);

router.get("/", boardingSpaController.getBoardingSpa);
router.post("/", boardingSpaController.createBoardingSpa);
router.put("/:id", boardingSpaController.updateBoardingSpa);
router.delete("/:id", boardingSpaController.deleteBoardingSpa);

module.exports = router;
