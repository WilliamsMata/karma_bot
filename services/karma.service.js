const Karma = require("../model/karma");

// Updates a user's karma score in the database
// incValue is optional and defaults to 1 if not provided
const updateKarma = async (msg, incValue = 1) => {
  try {
    // Get the user who sent the message
    const sender = msg.from;

    // Get the user who received the karma
    const receiver = msg.reply_to_message.from;

    const incGivenKarmaOrHate =
      incValue === 1 ? { givenKarma: 1 } : { givenHate: 1 };

    const [respSender, respReceiver] = await Promise.all([
      Karma.findOneAndUpdate(
        // Find the user's karma document based on userId and groupId
        {
          userId: sender.id,
          groupId: msg.chat.id,
        },
        // Update the givenKarma or givenHate value and user name
        {
          $inc: incGivenKarmaOrHate,
          userName: sender.username,
          firstName: sender.first_name,
        },
        // Create a new document if it doesn't exist
        { upsert: true, new: true }
      ),
      Karma.findOneAndUpdate(
        // Find the user's karma document based on userId and groupId
        {
          userId: receiver.id,
          groupId: msg.chat.id,
        },
        // Update the karma value, user name, and history
        {
          $inc: { karma: incValue },
          $push: {
            history: {
              timestamp: Date.now(),
              karmaChange: incValue,
            },
          },
          userName: receiver.username,
          firstName: receiver.first_name,
        },
        // Create a new document if it doesn't exist
        { upsert: true, new: true }
      ),
    ]);

    return {
      respSender,
      respReceiver,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Gets the top 10 users with the most karma in a given group
const getTopKarma = async (groupId, asc = false) => {
  try {
    const topKarmaUsers = await Karma.find({
      groupId,
      karma: { $exists: true },
    })
      // Sort the karma documents by karma score in descending or ascending order
      .sort({ karma: asc ? 1 : -1 })
      // Limit the results to the top 10 users
      .limit(10)
      // Select only the karma score and user name fields
      .select("karma firstName userName")
      .exec();

    return topKarmaUsers;
  } catch (error) {
    return null;
  }
};

const getTopGiven = async (groupId) => {
  try {
    const [topGivenKarma, topGivenHate] = await Promise.all([
      Karma.find({ groupId })
        // Sort the karma documents by karma score in descending or ascending order
        .sort({ givenKarma: -1 })
        // Limit the results to the top 10 users
        .limit(10)
        // Select only the karma score and user name fields
        .select("givenKarma firstName")
        .exec(),
      Karma.find({ groupId })
        // Sort the karma documents by karma score in descending or ascending order
        .sort({ givenHate: -1 })
        // Limit the results to the top 10 users
        .limit(10)
        // Select only the karma score and user name fields
        .select("givenHate firstName")
        .exec(),
    ]);

    return {
      topGivenKarma,
      topGivenHate,
    };
  } catch (error) {
    console.log(error);
    return {
      topGivenKarma: null,
      topGivenHate: null,
    };
  }
};

const transferKarma = async (msg, quantity = 0) => {
  if (quantity <= 0) {
    return "You must enter a positive number";
  }

  // Get the user who sent the message
  const sender = msg.from;

  // Get the user who received the karma
  const receiver = msg.reply_to_message.from;

  try {
    const userSenderKarma = await Karma.findOne({
      userId: sender.id,
      groupId: msg.chat.id,
    });

    // check if user have enough karma
    if (Number(userSenderKarma.karma) < quantity) {
      return "You don't have enough karma";
    }

    const [respSender, respReceiver] = await Promise.all([
      Karma.findOneAndUpdate(
        // Find the user's karma document based on userId and groupId
        {
          userId: sender.id,
          groupId: msg.chat.id,
        },
        // Update the givenKarma or givenHate value and user name
        {
          $inc: { karma: -quantity },
          userName: sender.username,
          firstName: sender.first_name,
          $push: {
            history: {
              timestamp: Date.now(),
              karmaChange: -quantity,
            },
          },
        },
        // Create a new document if it doesn't exist
        { upsert: true, new: true }
      ),
      Karma.findOneAndUpdate(
        // Find the user's karma document based on userId and groupId
        {
          userId: receiver.id,
          groupId: msg.chat.id,
        },
        // Update the karma value, user name, and history
        {
          $inc: { karma: quantity },
          $push: {
            history: {
              timestamp: Date.now(),
              karmaChange: quantity,
            },
          },
          userName: receiver.username,
          firstName: receiver.first_name,
        },
        // Create a new document if it doesn't exist
        { upsert: true, new: true }
      ),
    ]);

    return {
      respSender,
      respReceiver,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

async function getTopUsersByGroupId(groupId, daysBack = 1) {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    const topUsers = await Karma.aggregate([
      {
        $match: {
          groupId: groupId,
        },
      },
      {
        $addFields: {
          filteredHistory: {
            $filter: {
              input: "$history",
              as: "item",
              cond: {
                $and: [
                  { $gte: ["$$item.timestamp", startDate] },
                  { $lt: ["$$item.timestamp", now] },
                ],
              },
            },
          },
        },
      },
      {
        $unwind: "$filteredHistory",
      },
      {
        $group: {
          _id: "$userId",
          totalKarmaReceived: { $sum: "$filteredHistory.karmaChange" },
          userName: { $first: "$userName" },
          firstName: { $first: "$firstName" },
        },
      },
      {
        $sort: { totalKarmaReceived: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return topUsers;
  } catch (error) {
    console.error("Error fetching top users:", error);
    throw error;
  }
}

module.exports = {
  updateKarma,
  getTopKarma,
  getTopGiven,
  transferKarma,
  getTopUsersByGroupId,
};
