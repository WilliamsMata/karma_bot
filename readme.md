# ✨ KarmaBot for Telegram ✨

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-18.x+-green.svg)](https://nodejs.org/)
[![Telegram Bot API](https://img.shields.io/badge/Telegram%20Bot%20API-Node-blue?logo=telegram)](https://github.com/yagop/node-telegram-bot-api)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)](https://mongoosejs.com/)

A sophisticated Telegram bot designed to track user reputation (karma) within group chats seamlessly. Built with Node.js, Mongoose, and the `node-telegram-bot-api`.

---

<!-- Optional: Add a project logo or banner here -->
<!-- <p align="center">
  <img src="link/to/your/logo.png" alt="KarmaBot Logo" width="200"/>
</p> -->

**KarmaBot** allows group members to easily give or take karma points from each other, fostering interaction and providing insights into user contributions and popularity within the community. Features include leaderboards, individual karma tracking, transfer capabilities, and historical data.

---

## 🚀 Features

- 👍 **Give Karma:** Reply `+1` to a message to award a karma point.
- 👎 **Give Hate:** Reply `-1` to a message to deduct a karma point.
- ⏱️ **Cooldown:** Users must wait 1 minute between giving karma/hate.
- 👤 **My Status (`/me`):** Check your own karma score, total karma given, and total hate given.
- 🏆 **Top Users (`/top`):** View the top 10 users with the highest karma scores in the group.
- 😠 **Most Hated (`/hate`):** See the top 10 users with the lowest karma scores.
- ❤️ **Top Givers (`/mostgivers`):** Leaderboard of users who have given the most positive karma and the most negative karma (hate).
- 🔍 **Check Others (`/getkarma <user>`):** Look up the karma details of a specific user by name or @username.
- 📜 **Karma History (`/history`):** View your own last 10 karma changes.
- 🕵️ **Others' History (`/gethistory <user>`):** View the last 10 karma changes for a specific user.
- 💸 **Transfer Karma (`/send <amount>`):** Reply to a user to send them a specific amount of your own karma points.
- 📅 **Periodic Leaders:**
  - `/today`: Top users by karma received in the last 24 hours.
  - `/month`: Top users by karma received in the last 30 days.
  - `/year`: Top users by karma received in the last 365 days.
- ❓ **Help (`/help`):** Displays a comprehensive list of available commands.
- 💾 **Persistent Storage:** Karma data is stored reliably using MongoDB.
- ⚙️ **Modular Codebase:** Cleanly structured for maintainability and potential extension.

---

## 🛠️ How to Use (For Group Members)

1.  **Add the Bot:** Invite KarmaBot to your Telegram group.
2.  **Give/Take Karma:** Simply **reply** to any user's message with `+1` to give karma or `-1` to give hate.
3.  **Use Commands:** Type commands directly into the chat:
    - `/me` - To see your score.
    - `/top` - To see the leaderboard.
    - `/send <amount>` - **Reply** to a user's message with this command (e.g., `/send 5`).
    - `/help` - For the full command list.
    - ...and all other commands listed in the Features section!

---

## 🔧 Installation & Setup (For Developers)

Want to run your own instance of KarmaBot? Follow these steps:

1.  **Prerequisites:**

    - Node.js (v18.x or higher recommended)
    - npm or yarn
    - A MongoDB instance (local or cloud like MongoDB Atlas)
    - A Telegram Bot Token (Get one from @BotFather on Telegram)

2.  **Clone the Repository:**

    ```bash
    git clone https://github.com/WilliamsMata/karma_bot
    cd karmabot
    ```

3.  **Install Dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the root directory of the project and add the following variables:

    ```dotenv
    # .env
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
    TELEGRAM_BOT_USERNAME=YOUR_TELEGRAM_BOT_USERNAME_HERE
    MONGODB_CNN=YOUR_MONGODB_CONNECTION_STRING_HERE
    PORT=3000
    ```

    _Replace the placeholder values with your actual bot token and MongoDB connection string._

5.  **Run the Bot:**

    - **Development Mode (with nodemon for auto-reloads):**
      ```bash
      npm run dev
      ```
    - **Production Mode:**
      ```bash
      npm start
      ```

6.  **Database Indexes:**
    Upon the first run, Mongoose will attempt to create necessary indexes in your MongoDB collection based on the schema definitions. Ensure your MongoDB user has permissions to create indexes. If you added the `unique` index on `userId` and `groupId`, make sure your existing data doesn't violate this constraint _before_ starting the bot with the updated schema.

---

## 💻 Technology Stack

- **Backend:** Node.js
- **Telegram API:** `node-telegram-bot-api`
- **Database:** MongoDB with Mongoose ODM
- **Environment:** `dotenv`

---

## 🙌 Contributing

Contributions are welcome! If you'd like to improve KarmaBot, please follow these steps:

1.  **Fork** the repository.
2.  Create a new **branch** (`git checkout -b feature/your-feature-name`).
3.  Make your changes and **commit** them (`git commit -m 'Add some feature'`).
4.  **Push** to the branch (`git push origin feature/your-feature-name`).
5.  Open a **Pull Request**.

Please ensure your code adheres to the existing style and that any new functionality is well-documented. Feel free to open an issue to discuss potential changes beforehand.

---

## 📜 License

This project is licensed under the ISC License - see the [LICENSE](https://github.com/WilliamsMata/karma_bot/blob/main/LICENSE) file for details (or state "ISC License" if you don't have a separate file yet).

---

## 👤 Author

- **Williams Mata** - _Initial work_ - [GitHub](https://github.com/WilliamsMata)

---

Enjoy tracking karma in your Telegram groups! 🎉

# Acknowledgments

This project was inspired by the [karma bot](https://github.com/hbourgeot/karmagobot) ↗ from [hbourgeot](https://github.com/hbourgeot).
