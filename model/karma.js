const { Schema, model } = require("mongoose");

const KarmaSchema = Schema({
  userId: {
    type: Number,
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
  },
  groupId: {
    type: Number,
    required: true,
  },
  karma: {
    type: Number,
    default: 0,
  },
});

module.exports = model("karma", KarmaSchema);
