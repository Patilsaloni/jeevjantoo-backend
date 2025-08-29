const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../../middleware/auth");
const ngosAdminController = require("../../controllers/admin/ngosController");

router.use(verifyToken, isAdmin);

router.get("/", ngosAdminController.getNgos);
router.post("/", ngosAdminController.createNgo);
router.put("/:id", ngosAdminController.updateNgo);
router.delete("/:id", ngosAdminController.deleteNgo);

module.exports = router;
