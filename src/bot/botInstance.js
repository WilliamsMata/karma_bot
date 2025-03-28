const TelegramBot = require("node-telegram-bot-api");
const { botToken } = require("../config/environment");
const logger = require("../utils/logger");

/**
 * Inicializa y configura la instancia del bot de Telegram.
 * Se recomienda usar webhooks en producción en lugar de polling.
 * Ver: https://core.telegram.org/bots/api#setwebhook
 */
logger.info("Creating Telegram Bot instance...");
const bot = new TelegramBot(botToken, { polling: true });

bot.on("polling_error", (error) => {
  logger.error(`Polling error: ${error.code} - ${error.message}`);
});

bot.on("webhook_error", (error) => {
  logger.error(`Webhook error: ${error.code} - ${error.message}`);
});

module.exports = bot; // Exportar la instancia única del bot
