require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { dbConnection } = require("./database/config.db");
const Karma = require("./model/karma");
const { updateKarma, getTopKarma } = require("./services/karma.service");

const token = process.env.TELEGRAM_BOT_TOKEN;

dbConnection();

const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
  console.log(msg);

  if (msg.text === "+1" && msg.reply_to_message) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    const resp = await updateKarma(msg, 1);

    if (!resp) return;

    bot.sendMessage(
      msg.chat.id,
      `${msg.reply_to_message.from.first_name} has now ${resp.karma} of karma`
    );
  }

  if (msg.text === "-1" && msg.reply_to_message) {
    const resp = await updateKarma(msg, -1);

    if (!resp) return;

    bot.sendMessage(
      msg.chat.id,
      `${msg.reply_to_message.from.first_name} has now ${resp.karma} of karma`
    );
  }
});

bot.onText(/\/karma/, async (msg) => {
  const karma = await Karma.findOne({ userId: msg.from.id });

  const karmaScore = karma ? karma.karma : 0;

  bot.sendMessage(msg.chat.id, `Your karma is ${karmaScore}`);
});

bot.onText(/\/listkarma/, async (msg) => {
  const topKarmaUsers = await getTopKarma();

  let message = "Top 10 karma users:\n";

  topKarmaUsers.forEach((user, index) => {
    message += `${index + 1}. ${user.userName} has ${user.karma} of karma\n`;
  });

  bot.sendMessage(msg.chat.id, message);
});
