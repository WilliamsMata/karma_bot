# Karma Bot

This is a simple bot for tracking karma in a group chat. The bot allows users to give each other karma points by sending messages with +1 or -1 as a response to a message. The bot also provides commands to check a user's current karma score and to see a leaderboard of the top users with the most karma.

https://t.me/karma_tg_bot

# Installation

To use the bot, you will need to have Node.js installed on your system and a mongo database. Once you have those installed, follow these steps:

1. Clone this repository to your local machine.
2. Run npm install to install the required dependencies.
3. Create a .env file in the root directory of the project with the following content:

```
TELEGRAM_BOT_TOKEN=<your_bot_token_here>
MONGODB_CNN=<your_mongodb_uri_here>
```

Replace <your_bot_token_here> with the token for your Telegram bot, and <your_mongodb_uri_here> with the URI for your MongoDB instance.

4. Run npm start to start the bot.

# Usage

The following commands are available:

- +1 or -1: Respond to a message with +1 to increase the karma of the person who sent the message, or -1 to decrease it.
- /me: Send this command to the group to get your current karma score.
- /top: Send this command to the group to get a leaderboard of the top 10 users with the most karma in the group.
- /hate: Send this command to the group to get a leaderboard of the top 10 hated users in the group.
- /mostgivers: Send this command to the group to get a leaderboard of the top 10 users who have given the most karma and hate.
- /history: Allows users in a Telegram group to view their own karma history in the group.
- /getkarma <name or username>: Allows users in a Telegram group to view the karma of a specific user in the group.
- /gethistory <name or username>: Allows users in a Telegram group to view the karma history of a specific user in the group.
- /send <amount>: Allows users in a Telegram group to transfer karma to a specific user in the group.
- /help: Send this command to get info about the bot.
- /today: Allows users in a Telegram group to view the top 10 users that received karma today.
- /month: Allows users in a Telegram group to view the top 10 users that received karma this month.
- /year: Allows users in a Telegram group to view the top 10 users that received karma this year.

# Acknowledgments

This project was inspired by the [karma bot](https://github.com/hbourgeot/karmagobot) ↗ from [hbourgeot](https://github.com/hbourgeot).
