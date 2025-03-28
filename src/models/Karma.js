const { Schema, model } = require("mongoose");

const KarmaSchema = Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true, // Indexar userId para búsquedas rápidas
    },
    userName: {
      type: String,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    groupId: {
      type: Number,
      required: true,
      index: true, // Indexar groupId para búsquedas rápidas por grupo
    },
    karma: {
      type: Number,
      required: true,
      default: 0,
    },
    history: [
      {
        _id: false, // No necesitamos IDs para las entradas de historial
        timestamp: { type: Date, required: true, default: Date.now },
        karmaChange: { type: Number, required: true },
      },
    ],
    givenKarma: { type: Number, default: 0 },
    givenHate: { type: Number, default: 0 },
  },
  {
    // Añadir timestamps automáticos (createdAt, updatedAt) al documento principal
    timestamps: true,
  }
);

// Índice compuesto para consultas comunes (buscar usuario en un grupo específico)
KarmaSchema.index({ userId: 1, groupId: 1 }, { unique: true }); // Asegura que cada usuario tenga un solo registro por grupo

module.exports = model("Karma", KarmaSchema); // Exportar con nombre en singular y mayúscula
