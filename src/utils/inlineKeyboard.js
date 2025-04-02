const { botUsername } = require("../config/environment");

const getInlineKeyboard = (chatId) => [
  [
    {
      text: "Open Mini App",
      // web_app: {
      //   url: `https://t.me/karma_tg_test_bot?startapp=chatId${chatId}`,
      // },
      url: `https://t.me/${botUsername}?startapp=chatId${chatId}`,
    },
  ],
];

module.exports = {
  getInlineKeyboard,
};
