require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { dbConnection } = require("./database/config.db");
const Karma = require("./model/karma");
const { updateKarma, getTopKarma } = require("./services/karma.service");

const token = process.env.TELEGRAM_BOT_TOKEN;

dbConnection();

const bot = new TelegramBot(token, { polling: true });

// State variable to keep track of the last time karma was given or received per user
const karmaLastGivenOrReceived = {};

bot.on("message", async (msg) => {
  // console.log(msg);

  if (msg.text === "+1" && msg.reply_to_message) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    // Check if enough time has passed since karma was last given or received
    const lastTime = karmaLastGivenOrReceived[msg.from.id];
    if (lastTime && Date.now() - lastTime < 60000) {
      bot.sendMessage(
        msg.chat.id,
        "Please wait 1 minute before giving karma again."
      );
      return;
    }

    // Update the user's karma score
    const resp = await updateKarma(msg, 1);
    if (!resp) return;

    // Update the state variable with the last time karma was given or received
    karmaLastGivenOrReceived[msg.from.id] = Date.now();

    bot.sendMessage(
      msg.chat.id,
      `${msg.reply_to_message.from.first_name} has now ${resp.karma} of karma`
    );
  }

  if (msg.text === "-1" && msg.reply_to_message) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    // Check if enough time has passed since karma was last given or received
    const lastTime = karmaLastGivenOrReceived[msg.from.id];
    if (lastTime && Date.now() - lastTime < 60000) {
      bot.sendMessage(
        msg.chat.id,
        "Please wait 1 minute before giving karma again."
      );
      return;
    }

    // Update the user's karma score
    const resp = await updateKarma(msg, -1);
    if (!resp) return;

    // Update the state variable with the last time karma was given or received
    karmaLastGivenOrReceived[msg.from.id] = Date.now();

    bot.sendMessage(
      msg.chat.id,
      `${msg.reply_to_message.from.first_name} has now ${resp.karma} of karma`
    );
  }
});

bot.onText(/\/karma/, async (msg) => {
  try {
    // Find the karma document for the user in the current group
    const karma = await Karma.findOne({
      userId: msg.from.id,
      groupId: msg.chat.id,
    });

    // Get the user's karma score or default to 0 if no document found
    const karmaScore = karma ? karma.karma : 0;

    // Send a message with the user's karma score
    bot.sendMessage(msg.chat.id, `Your karma is ${karmaScore}`);
  } catch (error) {
    console.log(error);
  }
});

bot.onText(/\/listkarma/, async (msg) => {
  // Get the top 10 users with the most karma in the current group
  const topKarmaUsers = await getTopKarma(msg.chat.id);

  if (!topKarmaUsers) return;

  let message = "Top 10 karma users:\n";

  // Construct a message with the top karma users and their scores
  topKarmaUsers.forEach((user, index) => {
    message += `${index + 1}. ${user.userName} has ${user.karma} of karma\n`;
  });

  // Send the message with the top karma users
  bot.sendMessage(msg.chat.id, message);
});

/* 
  Help message
*/
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `
The following commands are available:

- +1 or -1: Respond to a message with +1 to increase the karma of the person who sent the message, or -1 to decrease it.
- /karma: Send this command to the group to get your current karma score.
- /listkarma: Send this command to the group to get a leaderboard of the top 10 users with the most karma in the group.
    `
  );
});
