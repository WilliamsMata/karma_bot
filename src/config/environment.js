require("dotenv").config();
const logger = require("../utils/logger");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const mongoUri = process.env.MONGODB_CNN;
const port = process.env.PORT || 3000;

let hasError = false;

if (!botToken) {
  logger.error("Error: TELEGRAM_BOT_TOKEN is not defined in .env file.");
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
