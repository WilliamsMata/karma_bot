require("dotenv").config();

const { dbConnection } = require("./src/config/database");
const { initializeBot } = require("./src/bot/eventListeners");
const logger = require("./src/utils/logger");

async function main() {
  try {
    // 1.Conectar a la base de datos
    await dbConnection();

    // 2. Inicializar el bot
    logger.info("Initializing Telegram Bot...");
    initializeBot();
    logger.info("Bot is running...");
  } catch (error) {
    logger.error("Failed to start the application:", error);
    process.exit(1);
  }
}

main();
