const { updateKarma } = require("../services/karmaService");
const bot = require("../bot/botInstance"); // Importar la instancia del bot
const logger = require("../utils/logger");

// Estado para el cooldown (mejor encapsulado aquí)
const karmaCooldowns = {}; // { userId: timestamp }

// Constantes
const KARMA_COOLDOWN_MS = 60 * 1000; // 1 minuto
const KARMA_REGEX = /(^|\s)(\+|-)1(\s|$)/; // Regex para +1 o -1

/**
 * Maneja los mensajes que podrían ser para dar/quitar karma (+1 / -1).
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleKarmaMessage = async (msg) => {
  // Validaciones iniciales
  if (!msg.text || msg.text.startsWith("/") || !msg.reply_to_message) {
    return; // No es un mensaje de texto, es comando o no es respuesta
  }

  if (!KARMA_REGEX.test(msg.text)) {
    return; // No contiene +1 o -1
  }

  const sender = msg.from;
  const receiver = msg.reply_to_message.from;

  // Evitar auto-karma
  if (receiver.id === sender.id) {
    logger.warn(
      `User ${
        sender.firstName || sender.username
      } tried to give karma to themselves.`
    );
    // Podrías enviar un mensaje o simplemente ignorar
    // bot.sendMessage(msg.chat.id, "You cannot give karma to yourself.", { reply_to_message_id: msg.message_id }).catch(logger.error);
    return;
  }

  // Evitar que ciertos bots den karma (si es necesario)
  if (sender.username === "Channel_Bot" || sender.is_bot) {
    logger.warn(`Bot ${sender.id} (${sender.username}) tried to give karma.`);
    // bot.sendMessage(msg.chat.id, `Bots cannot give karma.`).catch(logger.error);
    return;
  }

  // Verificar cooldown
  const lastGivenTime = karmaCooldowns[sender.id];
  const now = Date.now();
  if (lastGivenTime && now - lastGivenTime < KARMA_COOLDOWN_MS) {
    const timeLeft = Math.ceil(
      (KARMA_COOLDOWN_MS - (now - lastGivenTime)) / 1000
    );
    bot
      .sendMessage(
        msg.chat.id,
        `Please wait ${timeLeft} seconds before giving karma again.`,
        { reply_to_message_id: msg.message_id }
      )
      .catch((err) =>
        logger.error(`Error sending cooldown message: ${err.message}`)
      );
    return;
  }

  // Determinar el valor del karma (+1 o -1)
  const match = msg.text.match(KARMA_REGEX);
  const karmaValue = match[2] === "+" ? 1 : -1;

  // Actualizar el karma usando el servicio
  try {
    const result = await updateKarma(msg, karmaValue);
    if (result && result.respReceiver) {
      // Actualizar el timestamp del cooldown para el emisor
      karmaCooldowns[sender.id] = now;

      // Enviar mensaje de confirmación
      const receiverName =
        result.respReceiver.firstName || result.respReceiver.userName || "User";
      bot
        .sendMessage(
          msg.chat.id,
          `${receiverName} now has ${result.respReceiver.karma} karma.`,
          { reply_to_message_id: msg.message_id } // Responder al mensaje +1/-1
        )
        .catch((err) =>
          logger.error(
            `Error sending karma update confirmation: ${err.message}`
          )
        );
    } else {
      // Si updateKarma devuelve null o un resultado inesperado
      logger.error(
        `Karma update failed for message ${msg.message_id}. Service returned:`,
        result
      );
    }
  } catch (error) {
    // Captura de errores inesperados durante la llamada al servicio o el envío del mensaje
    logger.error(
      `Unexpected error in handleKarmaMessage for msg ${msg.message_id}:`,
      error
    );
  }
};

module.exports = {
  handleKarmaMessage,
};
