const Karma = require("../models/Karma");
const {
  getTopKarma,
  getTopGiven,
  transferKarma,
  getTopUsersByKarmaReceived,
  getDistinctGroupIds,
} = require("../services/karmaService");
const bot = require("../bot/botInstance");
const logger = require("../utils/logger");

// --- Helper Functions ---

/**
 * Envía un mensaje de forma segura, capturando errores.
 * @param {number} chatId - ID del chat.
 * @param {string} text - Texto del mensaje.
 * @param {object} [options] - Opciones adicionales para sendMessage.
 */
const safeSendMessage = (chatId, text, options = {}) => {
  bot
    .sendMessage(chatId, text, options)
    .catch((err) =>
      logger.error(`Error sending message to chat ${chatId}: ${err.message}`)
    );
};

/**
 * Formatea el nombre de un usuario (username o first name).
 * @param {object} user - Objeto usuario con `firstName` y `userName`.
 * @returns {string} Nombre formateado.
 */
const formatUserName = (user) => {
  if (!user) return "Unknown User";
  return user.userName ? `@${user.userName}` : user.firstName || "User";
};

/**
 * Busca un usuario por nombre o username en un grupo específico.
 * @param {string} input - El nombre o @username ingresado.
 * @param {number} groupId - El ID del grupo.
 * @returns {Promise<object|null>} El documento Karma del usuario o null si no se encuentra.
 */
const findUserKarma = async (input, groupId) => {
  const isUsername = input.startsWith("@");
  const queryValue = isUsername ? input.substring(1) : input;
  // Usar regex case-insensitive para la búsqueda
  const query = isUsername
    ? { userName: { $regex: new RegExp(`^${queryValue}$`, "i") }, groupId }
    : { firstName: { $regex: new RegExp(`^${queryValue}$`, "i") }, groupId };

  try {
    const karmaDoc = await Karma.findOne(query).lean(); // Usar lean si solo leemos datos
    return karmaDoc;
  } catch (error) {
    logger.error(
      `Error finding user karma for input "${input}" in group ${groupId}:`,
      error
    );
    return null;
  }
};

// --- Command Handlers ---

/**
 * Maneja el comando /me. Muestra el karma del usuario que envía el comando.
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleMeCommand = async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    const karma = await Karma.findOne({ userId, groupId: chatId }).lean();

    const senderName = formatUserName(karma);

    if (!karma) {
      safeSendMessage(
        chatId,
        `🙋 Hi ${senderName}, your karma is 0.\n\n♥ Given karma: 0.\n😠 Given hate: 0.`
      );
      return;
    }

    const message = `
🙋 Hi ${senderName}, your karma is ${karma.karma || 0}.

♥ Given karma: ${karma.givenKarma || 0}.
😠 Given hate: ${karma.givenHate || 0}.
    `;
    safeSendMessage(chatId, message.trim());
  } catch (error) {
    logger.error(
      `Error handling /me command for user ${userId} in group ${chatId}:`,
      error
    );
    safeSendMessage(
      chatId,
      "Sorry, I couldn't retrieve your karma information."
    );
  }
};

/**
 * Maneja el comando /top. Muestra los usuarios con más karma.
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleTopCommand = async (msg) => {
  const chatId = msg.chat.id;
  try {
    const topKarmaUsers = await getTopKarma(chatId, false, 10); // false = descending (top)

    if (!topKarmaUsers || topKarmaUsers.length === 0) {
      safeSendMessage(chatId, "No karma data available yet for this group.");
      return;
    }

    let message = "🏆 Top 10 Karma Users:\n\n";
    topKarmaUsers.forEach((user, index) => {
      const name =
        user.firstName ||
        (user.userName ? `@${user.userName}` : `User ID ${user.userId}`);
      message += `${index + 1}. ${name} has ${user.karma} karma\n`;
    });

    safeSendMessage(chatId, message);
  } catch (error) {
    // El error ya se loguea en el servicio, aquí solo enviamos mensaje genérico
    safeSendMessage(chatId, "Sorry, I couldn't retrieve the top karma users.");
  }
};

/**
 * Maneja el comando /hate. Muestra los usuarios con menos karma (más odiados).
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleHateCommand = async (msg) => {
  const chatId = msg.chat.id;
  try {
    // Usamos getTopKarma con ascending = true para obtener los más bajos
    const topHatedUsers = await getTopKarma(chatId, true, 10); // true = ascending (bottom/most hated)

    if (!topHatedUsers || topHatedUsers.length === 0) {
      safeSendMessage(chatId, "No karma data available yet for this group.");
      return;
    }

    // Filtrar usuarios con karma positivo si solo queremos mostrar los negativos (opcional)
    // const negativeKarmaUsers = topHatedUsers.filter(user => user.karma < 0);
    // if (negativeKarmaUsers.length === 0) {
    //    safeSendMessage(chatId, "Everyone is loved! No users with negative karma found.");
    //    return;
    // }

    let message = "😠 Top 10 Most Hated Users:\n\n";
    topHatedUsers.forEach((user, index) => {
      const name =
        user.firstName ||
        (user.userName ? `@${user.userName}` : `User ID ${user.userId}`);
      message += `${index + 1}. ${name} has ${user.karma} karma\n`;
    });

    safeSendMessage(chatId, message);
  } catch (error) {
    safeSendMessage(chatId, "Sorry, I couldn't retrieve the most hated users.");
  }
};

/**
 * Maneja el comando /mostgivers. Muestra quiénes han dado más karma y más odio.
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleMostGiversCommand = async (msg) => {
  const chatId = msg.chat.id;
  try {
    const { topGivenKarma, topGivenHate } = await getTopGiven(chatId, 10);

    if (
      (!topGivenKarma || topGivenKarma.length === 0) &&
      (!topGivenHate || topGivenHate.length === 0)
    ) {
      safeSendMessage(
        chatId,
        "No data available for karma givers in this group yet."
      );
      return;
    }

    let message = "";

    if (topGivenKarma && topGivenKarma.length > 0) {
      message += "♥ Top 10 Karma Givers:\n\n";
      topGivenKarma.forEach((user, index) => {
        const name =
          user.firstName ||
          (user.userName ? `@${user.userName}` : `User ID ${user.userId}`);
        message += `${index + 1}. ${name} has given ${user.givenKarma} karma\n`;
      });
    } else {
      message += "♥ No users have given positive karma yet.\n";
    }

    message += "\n"; // Separador

    if (topGivenHate && topGivenHate.length > 0) {
      message += "😠 Top 10 Hate Givers:\n\n";
      topGivenHate.forEach((user, index) => {
        const name =
          user.firstName ||
          (user.userName ? `@${user.userName}` : `User ID ${user.userId}`);
        message += `${index + 1}. ${name} has given ${user.givenHate} hate\n`;
      });
    } else {
      message += "😠 No users have given negative karma (hate) yet.\n";
    }

    safeSendMessage(chatId, message.trim());
  } catch (error) {
    safeSendMessage(chatId, "Sorry, I couldn't retrieve the top karma givers.");
  }
};

/**
 * Maneja el comando /getkarma <usuario>. Muestra el karma de un usuario específico.
 * @param {object} msg - El objeto de mensaje de Telegram.
 * @param {RegExpMatchArray} match - El resultado del match de la regex del comando.
 */
const handleGetKarmaCommand = async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].trim(); // El nombre o @username

  if (!input) {
    safeSendMessage(
      chatId,
      "Please specify a user. Usage: /getkarma <name or @username>",
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  try {
    const karma = await findUserKarma(input, chatId);

    if (!karma) {
      safeSendMessage(
        chatId,
        `No karma found for user "${input}" in this group.`,
        { reply_to_message_id: msg.message_id }
      );
      return;
    }

    const message = `
👤 User: ${input}
✨ Karma: ${karma.karma || 0}

♥ Given karma: ${karma.givenKarma || 0}.
😠 Given hate: ${karma.givenHate || 0}.
        `;
    safeSendMessage(chatId, message.trim(), {
      reply_to_message_id: msg.message_id,
    });
  } catch (error) {
    // El error ya fue logueado en findUserKarma si ocurrió allí
    safeSendMessage(
      chatId,
      `Sorry, I couldn't retrieve karma for "${input}".`,
      { reply_to_message_id: msg.message_id }
    );
  }
};

/**
 * Formatea las entradas del historial de karma.
 * @param {Array<object>} history - Array de entradas de historial.
 * @returns {string} String formateado con el historial.
 */
const formatHistory = (history) => {
  if (!history || history.length === 0) {
    return "No karma history found.";
  }
  return history
    .slice(-10) // Tomar solo las últimas 10 entradas
    .map((entry) => {
      const sign = entry.karmaChange > 0 ? "+" : "";
      // Asegurarse que timestamp es un objeto Date
      const date =
        entry.timestamp instanceof Date
          ? entry.timestamp
          : new Date(entry.timestamp);
      const dateString = date.toLocaleString() ?? "Invalid Date"; // Usar toLocaleString para formato legible
      return `${dateString}: ${sign}${entry.karmaChange}`;
    })
    .join("\n");
};

/**
 * Maneja el comando /gethistory <usuario>. Muestra el historial de karma de un usuario específico.
 * @param {object} msg - El objeto de mensaje de Telegram.
 * @param {RegExpMatchArray} match - El resultado del match de la regex del comando.
 */
const handleGetHistoryCommand = async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].trim();

  if (!input) {
    safeSendMessage(
      chatId,
      "Please specify a user. Usage: /gethistory <name or @username>",
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  try {
    const karma = await findUserKarma(input, chatId);

    if (!karma || !karma.history || karma.history.length === 0) {
      safeSendMessage(
        chatId,
        `No karma history found for user "${input}" in this group.`,
        { reply_to_message_id: msg.message_id }
      );
      return;
    }

    const historyMessage = formatHistory(karma.history);
    safeSendMessage(
      chatId,
      `📜 Karma history for ${input} (last 10 changes):\n\n${historyMessage}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (error) {
    logger.error(
      `Error handling /gethistory command for input "${input}" in group ${chatId}:`,
      error
    );
    safeSendMessage(
      chatId,
      `Sorry, I couldn't retrieve the history for "${input}".`,
      { reply_to_message_id: msg.message_id }
    );
  }
};

/**
 * Maneja el comando /history. Muestra el historial de karma del usuario que envía el comando.
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleHistoryCommand = async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // Necesitamos el historial, no usamos .lean()
    const karma = await Karma.findOne({ userId, groupId: chatId });
    const senderName = formatUserName(karma);

    if (!karma || !karma.history || karma.history.length === 0) {
      safeSendMessage(
        chatId,
        `${senderName}, you do not have any karma history in this group yet.`
      );
      return;
    }

    const historyMessage = formatHistory(karma.history);
    safeSendMessage(
      chatId,
      `📜 Your karma history (last 10 changes):\n\n${historyMessage}`
    );
  } catch (error) {
    logger.error(
      `Error handling /history command for user ${userId} in group ${chatId}:`,
      error
    );
    safeSendMessage(chatId, "Sorry, I couldn't retrieve your karma history.");
  }
};

/**
 * Maneja el comando /send <cantidad>. Transfiere karma a otro usuario.
 * @param {object} msg - El objeto de mensaje de Telegram.
 * @param {RegExpMatchArray} match - El resultado del match de la regex del comando.
 */
const handleSendCommand = async (msg, match) => {
  const chatId = msg.chat.id;
  const sender = msg.from;

  // 1. Validar que sea una respuesta a otro usuario
  if (!msg.reply_to_message) {
    safeSendMessage(
      chatId,
      "You need to reply to a user's message to send them karma.",
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  const receiver = msg.reply_to_message.from;

  // 2. Validar que no sea a sí mismo
  if (receiver.id === sender.id) {
    safeSendMessage(chatId, "You cannot send karma to yourself.", {
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  // 3. Validar que el receptor no sea un bot (opcional pero recomendado)
  if (receiver.is_bot) {
    safeSendMessage(chatId, "You cannot send karma to bots.", {
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  // 4. Validar y parsear la cantidad
  const inputQuantity = match[1]?.trim();
  if (!inputQuantity) {
    safeSendMessage(
      chatId,
      "You need to specify the amount to send. Ex: /send 10",
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  const quantity = Number(inputQuantity);

  // Usamos la validación dentro del servicio, pero podemos hacer una preliminar aquí
  if (isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    safeSendMessage(
      chatId,
      "The amount must be a positive whole number. Ex: /send 10",
      { reply_to_message_id: msg.message_id }
    );
    return;
  }

  // 5. Llamar al servicio para transferir
  try {
    const result = await transferKarma(msg, quantity);

    if (result === null) {
      // Error genérico del servicio (ya logueado)
      safeSendMessage(chatId, "An error occurred during the karma transfer.", {
        reply_to_message_id: msg.message_id,
      });
    } else if (typeof result === "string") {
      // Mensaje de error específico del servicio (ej. fondos insuficientes)
      safeSendMessage(chatId, result, { reply_to_message_id: msg.message_id });
    } else {
      // Éxito
      const senderName = formatUserName(result.respSender);
      const receiverName = formatUserName(result.respReceiver);
      safeSendMessage(
        chatId,
        `💸 ${senderName} has sent ${quantity} karma to ${receiverName}!\n\n${senderName} new karma: ${result.respSender.karma}\n${receiverName} new karma: ${result.respReceiver.karma}`
        // { reply_to_message_id: msg.message_id } // Quizás no queremos responder al /send, sino enviar un mensaje nuevo
      );
    }
  } catch (error) {
    logger.error(
      `Unexpected error handling /send command from ${sender.id} to ${receiver.id}:`,
      error
    );
    safeSendMessage(
      chatId,
      "A critical error occurred during the karma transfer.",
      { reply_to_message_id: msg.message_id }
    );
  }
};

/**
 * Maneja comandos de top karma recibido (/today, /month, /year).
 * @param {object} msg - El objeto de mensaje de Telegram.
 * @param {number} daysBack - Número de días hacia atrás (1, 30, 365).
 * @param {string} periodName - Nombre del período ("last 24 hours", "last 30 days", "last 365 days").
 */
const handleTopReceivedCommand = async (msg, daysBack, periodName) => {
  const chatId = msg.chat.id;
  try {
    const topUsers = await getTopUsersByKarmaReceived(chatId, daysBack, 10);

    if (!topUsers || topUsers.length === 0) {
      safeSendMessage(
        chatId,
        `No users received karma in the ${periodName} in this group.`
      );
      return;
    }

    let message = `🌟 Top 10 users by karma received in the ${periodName}:\n\n`;
    topUsers.forEach((user, index) => {
      const name =
        user.firstName ||
        (user.userName ? `@${user.userName}` : `User ID ${user.userId}`);
      message += `${index + 1}. ${name} received ${
        user.totalKarmaReceived
      } karma\n`;
    });

    safeSendMessage(chatId, message);
  } catch (error) {
    // Error ya logueado en el servicio
    safeSendMessage(
      chatId,
      `Sorry, I couldn't retrieve the top users for the ${periodName}.`
    );
  }
};

/**
 * Maneja el comando /groups. Muestra los IDs de grupos donde el bot está activo.
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleGroupsCommand = async (msg) => {
  const chatId = msg.chat.id;
  // Podrías añadir una restricción para que solo administradores o el dueño del bot puedan usarlo.
  // if (msg.from.id !== YOUR_ADMIN_USER_ID) {
  //     safeSendMessage(chatId, "You are not authorized to use this command.");
  //     return;
  // }

  try {
    const groupIds = await getDistinctGroupIds();

    if (!groupIds || groupIds.length === 0) {
      safeSendMessage(
        chatId,
        "The bot hasn't recorded karma in any group yet."
      );
      return;
    }

    // Es mejor no listar todos los IDs en un grupo público.
    // Considera enviar esta información por mensaje privado al admin o solo mostrar el total.
    const message = `📊 The bot is active in ${groupIds.length} group(s).`;
    // const message = `📊 Active Group IDs:\n${groupIds.join('\n')}\n\nTotal: ${groupIds.length}`;

    safeSendMessage(chatId, message);
  } catch (error) {
    // Error ya logueado en el servicio
    safeSendMessage(chatId, "Sorry, I couldn't retrieve the list of groups.");
  }
};

/**
 * Maneja el comando /help. Muestra la ayuda.
 * @param {object} msg - El objeto de mensaje de Telegram.
 */
const handleHelpCommand = (msg) => {
  const helpMessage = `
Hello! I'm the Karma Bot. Here's how you can interact with me:

*Basic Karma:*
  • Reply to a message with \`+1\` to give karma.
  • Reply to a message with \`-1\` to give hate (negative karma).
  *(Cooldown: 1 minute between giving karma/hate)*

*Check Karma:*
  • \`/me\`: Shows your current karma, given karma, and given hate.
  • \`/getkarma <name or @username>\`: Shows the karma details of a specific user.

*Leaderboards:*
  • \`/top\`: Top 10 users with the most karma.
  • \`/hate\`: Top 10 users with the least karma (most hated).
  • \`/mostgivers\`: Top 10 users who gave the most karma and hate.
  • \`/today\`: Top 10 users who received the most karma in the last 24 hours.
  • \`/month\`: Top 10 users who received the most karma in the last 30 days.
  • \`/year\`: Top 10 users who received the most karma in the last 365 days.

*History:*
  • \`/history\`: Shows your last 10 karma changes.
  • \`/gethistory <name or @username>\`: Shows the last 10 karma changes for a specific user.

*Transfer Karma:*
  • \`/send <amount>\`: Reply to a user's message to send them a specific amount of your karma. (e.g., \`/send 5\`)

*Other:*
  • \`/help\`: Shows this help message.
  `;
  // • \`/groups\`: (Admin only) Shows information about groups where the bot is active.

  safeSendMessage(msg.chat.id, helpMessage.trim(), { parse_mode: "Markdown" });
};

module.exports = {
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
};
