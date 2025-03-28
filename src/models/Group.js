const { Schema, model } = require("mongoose");

const GroupSchema = Schema(
  {
    groupId: {
      // ID numérico del chat/grupo de Telegram
      type: Number,
      required: true,
      unique: true, // Asegura que cada grupo sea único
      index: true,
    },
    groupName: {
      // Nombre del grupo (puede cambiar)
      type: String,
      index: true, // Podría ser útil para buscar grupos por nombre
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
  }
);

module.exports = model("Group", GroupSchema);
