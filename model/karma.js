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
  history: [
    {
      timestamp: { type: Date, required: true },
      karmaChange: { type: Number, required: true },
    },
  ],
});

// Defines a composite index for userId and groupId
KarmaSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = model("karma", KarmaSchema);
