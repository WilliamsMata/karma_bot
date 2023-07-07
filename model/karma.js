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

// Define un índice compuesto para userId y groupId
KarmaSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = model("karma", KarmaSchema);
