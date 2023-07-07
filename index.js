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

bot.onText(/\/me/, async (msg) => {
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

bot.onText(/\/top/, async (msg) => {
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

bot.onText(/\/hate/, async (msg) => {
  // Get the top 10 users with the most hate karma in the current group
  const topKarmaUsers = await getTopKarma(msg.chat.id, true);
  if (!topKarmaUsers) return;

  let message = "Top 10 most hated users:\n";

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
- /me: Send this command to the group to get your current karma score.
- /top: Send this command to the group to get a leaderboard of the top 10 users with the most karma in the group.
- /hate: Send this command to the group to get a leaderboard of the top 10 hated users in the group.
    `
  );
});

bot.onText(/\/gethistory (.+)/, async (msg, match) => {
  try {
    const input = match[1];
    const query = input.startsWith("@")
      ? { userName: input.substring(1), groupId: msg.chat.id }
      : { firstName: input, groupId: msg.chat.id };

    const karma = await Karma.findOne(query);

    if (!karma) {
      bot.sendMessage(
        msg.chat.id,
        `No karma history found for user ${input} in this group.`
      );
      return;
    }

    const history = karma.history.slice(-10);

    if (history.length === 0) {
      bot.sendMessage(
        msg.chat.id,
        `No karma history found for user ${input} in this group.`
      );
      return;
    }

    let message = `Karma history for ${input}:\n`;

    history.forEach((entry) => {
      const sign = entry.karmaChange > 0 ? "+" : "";
      message += `${new Date(entry.timestamp).toLocaleString()}: ${sign}${
        entry.karmaChange
      }\n`;
    });

    bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    console.log(error);
  }
});

bot.onText(/\/history/, async (msg) => {
  try {
    const karma = await Karma.findOne({
      userId: msg.from.id,
      groupId: msg.chat.id,
    });

    if (!karma) {
      bot.sendMessage(
        msg.chat.id,
        "You do not have any karma history in this group."
      );
      return;
    }

    const history = karma.history.slice(-10);

    if (history.length === 0) {
      bot.sendMessage(
        msg.chat.id,
        "You do not have any karma history in this group."
      );
      return;
    }

    let message = "Your karma history:\n";

    history.forEach((entry) => {
      const sign = entry.karmaChange > 0 ? "+" : "";
      message += `${new Date(entry.timestamp).toLocaleString()}: ${sign}${
        entry.karmaChange
      }\n`;
    });

    bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    console.log(error);
  }
});
