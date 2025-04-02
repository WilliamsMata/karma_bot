require("dotenv").config();
const logger = require("../utils/logger");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const botUsername = process.env.TELEGRAM_BOT_USERNAME;
const mongoUri = process.env.MONGODB_CNN;
const port = process.env.PORT || 3001;

let hasError = false;

if (!botToken) {
  logger.error("Error: TELEGRAM_BOT_TOKEN is not defined in .env file.");
  hasError = true;
}

if (!botUsername) {
  logger.error("Error: TELEGRAM_BOT_USERNAME is not defined in .env file.");
  hasError = true;
}

if (!mongoUri) {
  logger.error("Error: MONGODB_CNN is not defined in .env file.");
  hasError = true;
}

if (!process.env.PORT) {
  logger.warn(
    `Warning: PORT not defined in .env file. Using default port ${port}.`
  );
}

if (hasError) {
  process.exit(1);
}

module.exports = {
  botToken,
  mongoUri,
  port,
};
