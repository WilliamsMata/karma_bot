const Karma = require("../model/karma");

const updateKarma = async (msg, incValue = 1) => {
  try {
    const resp = await Karma.findOneAndUpdate(
      { userId: msg.reply_to_message.from.id, groupId: msg.chat.id },
      {
        $inc: { karma: incValue },
        userName: msg.reply_to_message.from.first_name,
      },
      { upsert: true, new: true }
    );

    return resp;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getTopKarma = async () => {
  try {
    const topKarmaUsers = await Karma.find()
      .sort({ karma: -1 })
      .limit(10)
      .select("userId karma userName")
      .exec();

    return topKarmaUsers;
  } catch (error) {
    return null;
  }
};

module.exports = {
  updateKarma,
  getTopKarma,
};
