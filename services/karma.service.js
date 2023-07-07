const Karma = require("../model/karma");

// Updates a user's karma score in the database
// incValue is optional and defaults to 1 if not provided
const updateKarma = async (msg, incValue = 1) => {
  try {
    const resp = await Karma.findOneAndUpdate(
      // Find the user's karma document based on userId and groupId
      { userId: msg.reply_to_message.from.id, groupId: msg.chat.id },
      // Update the karma value and user name
      {
        $inc: { karma: incValue },
        $push: {
          history: {
            timestamp: Date.now(),
            karmaChange: incValue,
          },
        },
        userName: msg.reply_to_message.from.username,
        firstName: msg.reply_to_message.from.first_name,
      },
      // Create a new document if it doesn't exist
      { upsert: true, new: true }
    );

    return resp;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Gets the top 10 users with the most karma in a given group
const getTopKarma = async (groupId, asc = false) => {
  try {
    const topKarmaUsers = await Karma.find({ groupId })
      // Sort the karma documents by karma score in descending or ascending order
      .sort({ karma: asc ? 1 : -1 })
      // Limit the results to the top 10 users
      .limit(10)
      // Select only the karma score and user name fields
      .select("karma userName")
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
