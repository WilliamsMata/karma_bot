// src/bot/eventListeners.js
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
  bot.on("message", (msg) => {
    if (msg.edit_date || msg.forward_date || !msg.text) return; // Ignorar editados, reenviados o sin texto
    // Solo llamar a handleKarmaMessage si NO es un comando para evitar doble procesamiento
    if (!msg.text.startsWith("/")) {
      handleKarmaMessage(msg);
    }
  });

  // Regex Helper: Añade opcionalmente la parte de @botusername
  // Ejemplo: /command OR /command@my_bot_name
  const cmd = (command) => new RegExp(`^\\/${command}(?:@\\w+)?$`);
  // Regex Helper para comandos con argumentos:
  // Ejemplo: /command arg OR /command@my_bot_name arg
  const cmdWithArg = (command) =>
    new RegExp(`^\\/${command}(?:@\\w+)?\\s+(.+)$`);
  // Regex Helper para comando /send con argumento numérico
  const sendCmd = () => new RegExp(`^\\/send(?:@\\w+)?\\s+(\\d+)$`);

  // Listeners para comandos específicos usando onText con regex mejorado
  bot.onText(cmd("me"), handleMeCommand);
  bot.onText(cmd("top"), handleTopCommand);
  bot.onText(cmd("hate"), handleHateCommand);
  bot.onText(cmd("mostgivers"), handleMostGiversCommand);
  bot.onText(cmd("history"), handleHistoryCommand);
  bot.onText(cmd("help"), handleHelpCommand);
  bot.onText(cmd("groups"), handleGroupsCommand);

  // Comandos con argumentos
  bot.onText(cmdWithArg("getkarma"), handleGetKarmaCommand);
  bot.onText(cmdWithArg("gethistory"), handleGetHistoryCommand);
  bot.onText(sendCmd(), handleSendCommand);

  // Comandos de tiempo para top recibidos
  bot.onText(cmd("today"), (msg) =>
    handleTopReceivedCommand(msg, 1, "last 24 hours")
  );
  bot.onText(cmd("month"), (msg) =>
    handleTopReceivedCommand(msg, 30, "last 30 days")
  );
  bot.onText(cmd("year"), (msg) =>
    handleTopReceivedCommand(msg, 365, "last 365 days")
  );

  logger.info("Bot event listeners registered successfully.");
};

module.exports = {
  initializeBot,
};
