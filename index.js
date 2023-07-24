require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { dbConnection } = require("./database/config.db");
const Karma = require("./model/karma");
const {
  updateKarma,
  getTopKarma,
  getTopGiven,
} = require("./services/karma.service");

const token = process.env.TELEGRAM_BOT_TOKEN;

dbConnection();

const bot = new TelegramBot(token, { polling: true });

// State variable to keep track of the last time karma was given or received per user
const karmaLastGivenOrReceived = {};

bot.on("message", async (msg) => {
  // console.log(msg);

  if (!msg.text) return;

  if (msg.reply_to_message && msg.text?.includes("+1")) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    if (msg.from.username === "Channel_Bot") {
      bot.sendMessage(msg.chat.id, `Lol what a cheater 🤦`);
      return;
    }

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
      `${msg.reply_to_message.from.first_name} has now ${resp.respReceiver.karma} of karma`
    );
  }

  if (msg.reply_to_message && msg.text?.includes("-1")) {
    if (msg.reply_to_message.from.id === msg.from.id) return;

    if (msg.from.username === "Channel_Bot") {
      bot.sendMessage(msg.chat.id, `Lol what a cheater 🤦`);
      return;
    }

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
      `${msg.reply_to_message.from.first_name} has now ${resp.respReceiver.karma} of karma`
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

    if (!karma) {
      bot.sendMessage(msg.chat.id, `Your karma is 0`);
      return;
    }

    // Get the user's karma score or default to 0 if no document found
    const karmaScore = karma.karma ? karma.karma : 0;

    // Send a message with the user's karma score
    bot.sendMessage(
      msg.chat.id,
      `
      🙋 Hi ${
        msg.from.username ? `@${msg.from.username}` : msg.from.first_name
      } your karma is ${karmaScore}.

♥ Given karma: ${karma.givenKarma}.
😠 Given hate: ${karma.givenHate}.
    `
    );
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
    message += `${index + 1}. ${user.firstName || user.userName} has ${
      user.karma
    } of karma\n`;
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
    message += `${index + 1}. ${user.firstName || user.userName} has ${
      user.karma
    } of karma\n`;
  });

  // Send the message with the top karma users
  bot.sendMessage(msg.chat.id, message);
});

bot.onText(/\/mostgivers/, async (msg) => {
  // Get the top 10 users with the most karma in the current group
  const { topGivenKarma, topGivenHate } = await getTopGiven(msg.chat.id);

  if (!topGivenKarma || !topGivenHate) return;

  let message = "♥ Top 10 users who have given the most karma:\n";

  // Construct a message with the top karma users and their scores
  topGivenKarma.forEach((user, index) => {
    if (user.givenKarma === 0) return;
    message += `${index + 1}. ${user.firstName} have given ${
      user.givenKarma
    } of karma\n`;
  });

  message += "\n😠 Top 10 users who have given the most hate:\n";

  topGivenHate.forEach((user, index) => {
    if (user.givenHate === 0) return;
    message += `${index + 1}. ${user.firstName} have given ${
      user.givenHate
    } of hate\n`;
  });

  // Send the message with the top karma users
  bot.sendMessage(msg.chat.id, message);
});

// Handles the "/getkarma" command to view the karma of a specific user in the group
bot.onText(/\/getkarma (.+)/, async (msg, match) => {
  try {
    // Extracts the input username or first name from the command argument
    const input = match[1];
    // Defines the query object to search for the user's karma history, using the regex to make the search case-insensitive
    const query = input.startsWith("@")
      ? {
          userName: { $regex: new RegExp(`^${input.substring(1)}$`, "i") },
          groupId: msg.chat.id,
        }
      : {
          firstName: { $regex: new RegExp(`^${input}$`, "i") },
          groupId: msg.chat.id,
        };
    // Finds the Karma document for the user and group
    const karma = await Karma.findOne(query);
    // If the user's karma history is not found, sends an error message and exits the function
    if (!karma) {
      bot.sendMessage(
        msg.chat.id,
        `No karma found for user ${input} in this group.`
      );
      return;
    }

    // Get the user's karma score or default to 0 if no document found
    const karmaScore = karma.karma ? karma.karma : 0;

    // Send a message with the user's karma score
    bot.sendMessage(
      msg.chat.id,
      `
      ${input} has ${karmaScore} karma.

♥ Given karma: ${karma.givenKarma}.
😠 Given hate: ${karma.givenHate}.
    `
    );
  } catch (error) {
    console.log(error);
  }
});

// Handles the "/gethistory" command to view the karma history of a specific user in the group
bot.onText(/\/gethistory (.+)/, async (msg, match) => {
  try {
    // Extracts the input username or first name from the command argument
    const input = match[1];
    // Defines the query object to search for the user's karma history, using the regex to make the search case-insensitive
    const query = input.startsWith("@")
      ? {
          userName: { $regex: new RegExp(`^${input.substring(1)}$`, "i") },
          groupId: msg.chat.id,
        }
      : {
          firstName: { $regex: new RegExp(`^${input}$`, "i") },
          groupId: msg.chat.id,
        };
    // Finds the Karma document for the user and group
    const karma = await Karma.findOne(query);
    // If the user's karma history is not found, sends an error message and exits the function
    if (!karma) {
      bot.sendMessage(
        msg.chat.id,
        `No karma history found for user ${input} in this group.`
      );
      return;
    }
    // Gets the last 10 entries from the user's karma history
    const history = karma.history.slice(-10);
    // If there are no entries in the user's karma history, sends an error message and exits the function
    if (history.length === 0) {
      bot.sendMessage(
        msg.chat.id,
        `No karma history found for user ${input} in this group.`
      );
      return;
    }
    // Creates a message with the user's karma history and sends it to the chat
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

// Handles the "/history" command to view the karma history of the user who sent the message
bot.onText(/\/history/, async (msg) => {
  try {
    // Finds the Karma document for the user and group
    const karma = await Karma.findOne({
      userId: msg.from.id,
      groupId: msg.chat.id,
    });
    // If the user's karma history is not found, sends an error message and exits the function
    if (!karma) {
      bot.sendMessage(
        msg.chat.id,
        "You do not have any karma history in this group."
      );
      return;
    }
    // Gets the last 10 entries from the user's karma history
    const history = karma.history.slice(-10);
    // If there are no entries in the user's karma history, sends an error message and exits the function
    if (history.length === 0) {
      bot.sendMessage(
        msg.chat.id,
        "You do not have any karma history in this group."
      );
      return;
    }
    // Creates a message with the user's karma history and sends it to the chat
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
- /mostgivers: Send this command to the group to get a leaderboard of the top 10 users who have given the most karma and hate.
- /hate: Send this command to the group to get a leaderboard of the top 10 hated users in the group.
- /history: Allows users in a Telegram group to view their own karma history in the group.
- /getkarma <name or username>: Allows users in a Telegram group to view the karma of a specific user in the group.
- /gethistory <name or username>: Allows users in a Telegram group to view the karma history of a specific user in the group.
    `
  );
});
