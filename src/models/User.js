const { Schema, model } = require("mongoose");

const UserSchema = Schema(
  {
    userId: {
      // ID numérico de Telegram
      type: Number,
      required: true,
      unique: true, // Asegura que cada usuario de Telegram sea único
      index: true,
    },
    userName: {
      // @username (puede cambiar o no existir)
      type: String,
      index: true, // Indexar para búsquedas si es necesario
    },
    firstName: {
      // Nombre (puede cambiar)
      type: String,
      required: true,
    },
    lastName: {
      // Apellido (puede cambiar o no existir)
      type: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
  }
);

module.exports = model("User", UserSchema);
