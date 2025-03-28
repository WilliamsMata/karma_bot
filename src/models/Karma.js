const { Schema, model } = require("mongoose");

const KarmaSchema = Schema(
  {
    user: {
      // Referencia al documento User
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      // Referencia al documento Group
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    karma: {
      type: Number,
      required: true,
      default: 0,
    },
    history: [
      {
        _id: false,
        timestamp: { type: Date, required: true, default: Date.now },
        karmaChange: { type: Number, required: true },
      },
    ],
    givenKarma: { type: Number, default: 0 }, // Karma positivo dado *por este usuario en este grupo*
    givenHate: { type: Number, default: 0 }, // Karma negativo dado *por este usuario en este grupo*
    // Ya no necesitamos userId, groupId, userName, firstName, lastName aquí
  },
  {
    timestamps: true, // createdAt, updatedAt para esta relación específica
  }
);

// Índice compuesto para asegurar que un usuario solo tenga un registro de karma por grupo
// Y para optimizar búsquedas de karma de un usuario en un grupo específico
KarmaSchema.index({ user: 1, group: 1 }, { unique: true });

// Índices adicionales si se prevén consultas frecuentes
KarmaSchema.index({ group: 1, karma: -1 }); // Para /top por grupo
KarmaSchema.index({ group: 1, karma: 1 }); // Para /hate por grupo
KarmaSchema.index({ group: 1, givenKarma: -1 }); // Para /mostgivers karma
KarmaSchema.index({ group: 1, givenHate: -1 }); // Para /mostgivers hate

module.exports = model("Karma", KarmaSchema);
