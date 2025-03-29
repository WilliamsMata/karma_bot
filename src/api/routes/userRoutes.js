const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Definir la ruta GET para obtener los grupos de un usuario por su ID de Telegram
// GET /api/users/:userId/groups
router.get("/:userId/groups", userController.getUserGroups);

// --- Aquí puedes añadir más rutas relacionadas con usuarios en el futuro ---
// ej: router.get("/:userId", userController.getUserDetails);

module.exports = router;
