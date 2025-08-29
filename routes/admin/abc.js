const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../../middleware/auth');
const abcController = require('../../controllers/admin/abcController');

// Protect all routes
router.use(verifyToken, isAdmin);

router.get("/", abcController.getABC);
router.get("/:id", abcController.getABCById);
router.post("/", abcController.createABC);
router.put("/:id", abcController.updateABC);
router.delete("/:id", abcController.deleteABC);


module.exports = router;
