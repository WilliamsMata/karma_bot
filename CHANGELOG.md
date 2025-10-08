# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-10-08

### Added

- **Localized Telegram Experience:** Introduced language-aware dictionaries for `/settings`, inline keyboards, and contextual messages so every interaction honors the user's preferred language.
- **Mini App Keyboard Translations:** The "Open Mini App" button now adapts to each supported language to provide a consistent Mini App launch experience.

### Changed

- **Settings Command UX:** Reworked the `/settings` command flows to rely on centralized dictionaries, ensuring admins see cooldown and language menus in their own language with localized inline buttons.
- **Shared Services Internationalization:** Updated the shared keyboard and language services to propagate user language across command handlers for a cohesive multi-language bot environment.

## [2.0.0] - 2025-07-24

### Changed

- **Complete Architectural Migration:** The entire application has been rewritten from a classic Node.js/Express stack to a modern, robust, and scalable **NestJS** framework.
- **Switched to TypeScript:** The entire codebase is now strictly typed with TypeScript, improving code quality, maintainability, and developer experience.
- **Upgraded Telegram Library:** Migrated from `node-telegram-bot-api` to the more modern and NestJS-friendly `Telegraf`.

### Added

- **SOLID Principles:** Implemented a clean architecture with decoupled services, repositories, and controllers.
- **Command Handler Pattern:** Introduced a scalable pattern for managing bot commands, making it easy to add new commands without modifying existing code.
- **Full REST API:** Added a complete REST API with endpoints for groups and users, designed to power the companion Telegram Mini App.
- **Type-Safe Configuration:** Implemented `@nestjs/config` with Joi for robust, validated environment variable management.
- **API Security:** Added rate limiting (`@nestjs/throttler`) to all API endpoints to prevent abuse.
- **Professional Dockerfile:** Optimized for multi-stage builds, smaller production images, and enhanced security.

### Removed

- Removed direct dependencies between services and repositories of other domains.
- Removed all legacy code from the `v1.0.0-legacy` version.

---

## [1.0.0-legacy]

- Initial release based on Node.js and `node-telegram-bot-api`.
