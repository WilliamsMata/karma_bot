const express = require("express");
const { dbConnection } = require("./src/config/database");
const { initializeBot } = require("./src/bot/eventListeners");
const { port } = require("./src/config/environment");
const karmaApiRoutes = require("./src/api/routes/karmaRoutes");
const logger = require("./src/utils/logger");

async function main() {
  try {
    // 1. Conectar a la base de datos
    await dbConnection();

    // 2. Inicializar el bot de Telegram
    logger.info("Initializing Telegram Bot...");
    initializeBot();
    logger.info("Telegram Bot is running...");

    // 3. Configurar y arrancar el servidor Express para la API
    const app = express();
    app.use(express.json()); // Middleware para parsear JSON bodies (útil para futuras rutas POST/PUT)

    // Montar las rutas de la API bajo el prefijo /api/karma
    app.use("/api/karma", karmaApiRoutes);

    // Iniciar el servidor API
    app.listen(port, () => {
      logger.info(`API Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error("Failed to start the application:", error);
    process.exit(1);
  }
}

main();
