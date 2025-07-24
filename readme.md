# ✨ KarmaBot: A Modern Telegram Karma Bot ✨

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![NestJS](https://img.shields.io/badge/NestJS-v10.x-red?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-v4.x-blue?logo=telegram)](https://telegraf.js.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)](https://mongoosejs.com/)

A sophisticated Telegram bot designed to seamlessly track user reputation (karma) within group chats, now rebuilt with the power and structure of **NestJS**.

KarmaBot allows group members to easily give or take karma points from each other, fostering community interaction and providing valuable insights. It features comprehensive leaderboards, individual karma tracking, and exposes a robust API perfect for its accompanying **Telegram Mini App**.

## 📖 Table of Contents

- [✨ KarmaBot: A Modern Telegram Karma Bot ✨](#-karmabot-a-modern-telegram-karma-bot-)
  - [📖 Table of Contents](#-table-of-contents)
  - [🚀 For Group Members](#-for-group-members)
    - [Key Features](#key-features)
    - [Getting Started](#getting-started)
  - [👨‍💻 For Developers](#-for-developers)
    - [Architectural Philosophy](#architectural-philosophy)
    - [💻 Technology Stack](#-technology-stack)
    - [🔧 Installation \& Setup](#-installation--setup)
    - [📂 Project Structure](#-project-structure)
    - [🙌 Contributing](#-contributing)
    - [📜 License](#-license)
    - [👤 Author](#-author)
    - [🙏 Acknowledgments](#-acknowledgments)

## 🚀 For Group Members

### Key Features

- 👍 **Give Karma:** Reply `+1` to a message to award a karma point.
- 👎 **Give Hate:** Reply `-1` to a message to deduct a karma point (hate).
- ⏱️ **Cooldown System:** A 1-minute cooldown prevents spamming karma.
- 👤 **Your Status (`/me`):** Check your own karma score and see how much karma and hate you've given.
- 🏆 **Leaderboards:**
  - `/top`: The top 10 users with the most karma.
  - `/hate`: The top 10 users with the least karma.
  - `/mostgivers`: See who gives the most karma and hate.
- 📅 **Periodic Rankings:**
  - `/today`: Top users by karma received in the last 24 hours.
  - `/month`: Top users by karma received in the last 30 days.
  - `/year`: Top users by karma received in the last 365 days.
- 💸 **Transfer Karma (`/send <amount>`):** Reply to a user's message to send them some of your own karma points.
- 📜 **Karma History:**
  - `/history`: View your own last 10 karma changes.
  - `/gethistory <user>`: View the history for a specific user.
- 📱 **Mini App Integration:** Most commands include an "Open Mini App" button for a rich, interactive experience.

### Getting Started

1.  **Add the Bot:** An admin must invite KarmaBot to your Telegram group.
2.  **Give Karma:** Simply **reply** to a user's message with `+1` or `-1`.
3.  **Use Commands:** Type commands like `/me`, `/top`, or `/help` directly in the chat to interact with the bot.

---

## 👨‍💻 For Developers

This project is a complete migration of a classic Node.js bot to a modern, scalable, and type-safe NestJS architecture. It serves as a real-world example of applying enterprise-level software design principles to a Telegram bot.

### Architectural Philosophy

The codebase is structured following SOLID principles to ensure it is maintainable, testable, and easy to extend.

- **Modular & Scalable:** Built on the NestJS module system, each domain (`users`, `groups`, `karma`) is a self-contained module with its own repository and service, promoting low coupling.
- **SOLID Principles:**
  - **Single Responsibility:** Services are decoupled. `KarmaService` depends on `UsersService`, not `UsersRepository`, ensuring that each service is the single source of truth for its domain.
  - **Open/Closed:** The application is open for extension but closed for modification.
- **Command Pattern:** Adding a new command is as simple as creating a new `CommandHandler` class that implements a generic interface (`ICommandHandler`). The core `TelegramService` discovers and registers it without needing any modification.
- **Type Safety:** Fully written in TypeScript, using custom types (`TextCommandContext`), DTOs, and generics to prevent common runtime errors and ensure a reliable developer experience.

### 💻 Technology Stack

| Role                  | Technology                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**         | [**NestJS**](https://nestjs.com/) - A progressive Node.js framework for building efficient and scalable server-side applications.                   |
| **Language**          | [**TypeScript**](https://www.typescriptlang.org/) - For robust type safety and modern JavaScript features.                                          |
| **Telegram API**      | [**Telegraf**](https://telegraf.js.org/) - A modern and powerful framework for building Telegram bots.                                              |
| **Database**          | [**MongoDB**](https://www.mongodb.com/) with [**Mongoose**](https://mongoosejs.com/) - For flexible and persistent data storage.                    |
| **Configuration**     | [**@nestjs/config**](https://docs.nestjs.com/techniques/configuration) with **Joi** - For type-safe environment variable management and validation. |
| **API Rate Limiting** | [**@nestjs/throttler**](https://docs.nestjs.com/security/rate-limiting) - To protect API endpoints from abuse.                                      |

### 🔧 Installation & Setup

1.  **Prerequisites:**
    - Node.js (v18.x or higher)
    - npm or yarn
    - A running MongoDB instance (local or cloud)
    - A Telegram Bot Token and Username (from [@BotFather](https://t.me/BotFather))

2.  **Clone the Repository:**

    ```bash
    git clone https://github.com/WilliamsMata/karma_bot
    cd karma_bot
    ```

3.  **Install Dependencies:**

    ```bash
    npm install
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the project root by copying the example: `cp .env.example .env`. Then, fill in the required variables:

    ```dotenv
    # .env

    # Your Telegram bot token from @BotFather
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

    # Your bot's username
    TELEGRAM_BOT_USERNAME=YOUR_TELEGRAM_BOT_USERNAME_HERE

    # MongoDB connection string
    MONGODB_URI=mongodb://localhost:27017/karma_bot

    # The port for the API server
    PORT=3000
    ```

5.  **Run the Application:**
    - **Development Mode (with auto-reload):**
      ```bash
      npm run start:dev
      ```
    - **Production Mode:**
      ```bash
      npm run build
      npm run start:prod
      ```

### 📂 Project Structure

```
src
├── api/                # API controllers and modules (for the Mini App)
│   ├── karma/
│   └── users/
├── karma/              # Core business logic for karma
│   ├── dto/
│   ├── schemas/
│   ├── karma.module.ts
│   ├── karma.repository.ts
│   └── karma.service.ts
├── telegram/           # All Telegram-specific logic
│   ├── commands/       # Command pattern implementation
│   │   ├── handlers/   # Individual classes for each command (/me, /top, etc.)
│   │   └── commands.module.ts
│   ├── handlers/       # Handlers for non-command events (e.g., +1 messages)
│   ├── shared/         # Shared utilities (e.g., keyboard service)
│   ├── telegram.module.ts
│   └── telegram.service.ts # Main service for bot connection and event routing
├── users/              # Business logic for users
├── groups/             # Business logic for groups
├── database/           # Abstract repository and database module setup
├── app.module.ts       # Root module of the application
└── main.ts             # Application entry point
```

---

### 🙌 Contributing

Contributions are highly welcome! If you have ideas for improvements or find a bug, please feel free to:

1.  **Fork** the repository.
2.  Create a new **branch** for your feature or fix.
3.  Make your changes and **commit** them with clear messages.
4.  Push to your branch and open a **Pull Request**.

### 📜 License

This project is licensed under the **ISC License**.

### 👤 Author

- **Williams Mata** - [GitHub](https://github.com/WilliamsMata)

### 🙏 Acknowledgments

This project was inspired by the [karma bot](https://github.com/hbourgeot/karmagobot) from [hbourgeot](https://github.com/hbourgeot).
