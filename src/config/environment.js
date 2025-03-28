const botToken = process.env.TELEGRAM_BOT_TOKEN;
const mongoUri = process.env.MONGODB_CNN;

if (!botToken) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not defined in .env file.");
  process.exit(1);
}

if (!mongoUri) {
  console.error("Error: MONGODB_CNN is not defined in .env file.");
  process.exit(1);
}

module.exports = {
  botToken,
  mongoUri,
};
