require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { dbConnection } = require("./database/config.db");
const Karma = require("./model/karma");
const { updateKarma, getTopKarma } = require("./services/karma.service");

const token = process.env.TELEGRAM_BOT_TOKEN;

dbConnection();

const bot = new TelegramBot(token, { polling: true });

// Variable de estado para mantener un registro del último tiempo en que se otorgó o recibió karma por usuario
const karmaLastGivenOrReceived = {};

bot.on("message", async (msg) => {
  // console.log(msg);

  if (msg.text === "+1" && msg.reply_to_message) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    // Verificar si ha pasado suficiente tiempo desde que se otorgó o recibió karma por última vez
    const lastTime = karmaLastGivenOrReceived[msg.from.id];
    if (lastTime && Date.now() - lastTime < 60000) {
      bot.sendMessage(
        msg.chat.id,
        "Please wait 1 minute before giving karma again."
      );
      return;
    }

    // Actualizar la puntuación de karma del usuario
    const resp = await updateKarma(msg, 1);
    if (!resp) return;

    // Actualizar la variable de estado con el último tiempo en que se otorgó o recibió karma
    karmaLastGivenOrReceived[msg.from.id] = Date.now();

    bot.sendMessage(
      msg.chat.id,
      `${msg.reply_to_message.from.first_name} has now ${resp.karma} of karma`
    );
  }

  if (msg.text === "-1" && msg.reply_to_message) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    // Verificar si ha pasado suficiente tiempo desde que se otorgó o recibió karma por última vez
    const lastTime = karmaLastGivenOrReceived[msg.from.id];
    if (lastTime && Date.now() - lastTime < 60000) {
      bot.sendMessage(
        msg.chat.id,
        "Please wait 1 minute before giving karma again."
      );
      return;
    }

    // Actualizar la puntuación de karma del usuario
    const resp = await updateKarma(msg, -1);
    if (!resp) return;

    // Actualizar la variable de estado con el último tiempo en que se otorgó o recibió karma
    karmaLastGivenOrReceived[msg.from.id] = Date.now();

    bot.sendMessage(
      msg.chat.id,
      `${msg.reply_to_message.from.first_name} has now ${resp.karma} of karma`
    );
  }
});

bot.onText(/\/karma/, async (msg) => {
  try {
    const karma = await Karma.findOne({
      userId: msg.from.id,
      groupId: msg.chat.id,
    });

    const karmaScore = karma ? karma.karma : 0;

    bot.sendMessage(msg.chat.id, `Your karma is ${karmaScore}`);
  } catch (error) {
    console.log(error);
  }
});

bot.onText(/\/listkarma/, async (msg) => {
  const topKarmaUsers = await getTopKarma(msg.chat.id);

  if (!topKarmaUsers) return;

  let message = "Top 10 karma users:\n";

  topKarmaUsers.forEach((user, index) => {
    message += `${index + 1}. ${user.userName} has ${user.karma} of karma\n`;
  });

  bot.sendMessage(msg.chat.id, message);
});
