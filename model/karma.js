const { Schema, model } = require("mongoose");

const KarmaSchema = Schema({
  userId: {
    type: Number,
    required: true,
  },
  userName: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  groupId: {
    type: Number,
    required: true,
  },
  karma: {
    type: Number,
    required: true,
    default: 0,
    min: -Infinity,
    max: Infinity,
  },
  history: [
    {
      timestamp: { type: Date, required: true },
      karmaChange: { type: Number, required: true },
    },
  ],
  givenKarma: { type: Number, default: 0 },
  givenHate: { type: Number, default: 0 },
});

module.exports = model("karma", KarmaSchema);
