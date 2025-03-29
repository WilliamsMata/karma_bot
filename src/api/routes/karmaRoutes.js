const express = require("express");
const karmaController = require("../controllers/karmaController");

const router = express.Router();

// GET /api/karma/total
router.get("/total", karmaController.getTotal);
// GET /api/karma/group/:groupId
router.get("/group/:groupId", karmaController.getUsersByGroupId);

// ej: router.get("/user/:userId", karmaController.getUserDetails);
// ej: router.get("/stats", karmaController.getGlobalStats);

module.exports = router;
