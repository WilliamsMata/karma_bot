const bot = require("./botInstance"); // Importar la instancia del bot
const { handleKarmaMessage } = require("../handlers/messageHandler");
const {
  handleMeCommand,
  handleTopCommand,
  handleHateCommand,
  handleMostGiversCommand,
  handleGetKarmaCommand,
  handleGetHistoryCommand,
  handleHistoryCommand,
  handleSendCommand,
  handleTopReceivedCommand,
  handleGroupsCommand,
  handleHelpCommand,
} = require("../handlers/commandHandler");
const logger = require("../utils/logger");

/**
 * Inicializa todos los listeners de eventos del bot.
 */
const initializeBot = () => {
  logger.info("Registering bot event listeners...");

  // Listener para mensajes generales (posiblemente +1/-1)
  // Se ejecuta para CUALQUIER mensaje, así que el handler debe filtrar bien.
  bot.on("message", (msg) => {
    // Evitar procesar mensajes editados o de canales si no se desea
    if (msg.edit_date || msg.forward_date) return;
    // Llamar al manejador de mensajes de karma
    handleKarmaMessage(msg);
  });

  // Listeners para comandos específicos usando onText
  bot.onText(/^\/me$/, handleMeCommand);
  bot.onText(/^\/top$/, handleTopCommand);
  bot.onText(/^\/hate$/, handleHateCommand);
  bot.onText(/^\/mostgivers$/, handleMostGiversCommand);
  bot.onText(/^\/history$/, handleHistoryCommand);
  bot.onText(/^\/help$/, handleHelpCommand);
  bot.onText(/^\/groups$/, handleGroupsCommand);

  // Comandos con argumentos
  bot.onText(/^\/getkarma(?:@\w+)?\s+(.+)/, handleGetKarmaCommand); // Acepta /getkarma @user o /getkarma user name
  bot.onText(/^\/gethistory(?:@\w+)?\s+(.+)/, handleGetHistoryCommand);
  bot.onText(/^\/send\s+(\d+)/, handleSendCommand);

  // Comandos de tiempo para top recibidos
  bot.onText(/^\/today$/, (msg) =>
    handleTopReceivedCommand(msg, 1, "last 24 hours")
  );
  bot.onText(/^\/month$/, (msg) =>
    handleTopReceivedCommand(msg, 30, "last 30 days")
  );
  bot.onText(/^\/year$/, (msg) =>
    handleTopReceivedCommand(msg, 365, "last 365 days")
  );

  logger.info("Bot event listeners registered successfully.");
};

module.exports = {
  initializeBot,
};
