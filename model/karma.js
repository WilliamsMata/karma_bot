const { Schema, model } = require("mongoose");

const KarmaSchema = Schema({
  userId: {
    type: Number,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  groupId: {
    type: Number,
    required: true,
  },
  karma: Schema.Types.Mixed,
});

module.exports = model("karma", KarmaSchema);
