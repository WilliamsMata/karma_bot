require("dotenv").config({ path: "../.env" }); // Ajusta la ruta a tu .env si es necesario

const mongoose = require("mongoose");
const { mongoUri } = require("../src/config/environment"); // Carga la URI de la DB
const logger = require("../src/utils/logger"); // Usa tu logger

// Importar los NUEVOS modelos
const User = require("../src/models/User");
const Group = require("../src/models/Group");
const Karma = require("../src/models/Karma"); // Este es el NUEVO modelo Karma

// --- IMPORTANTE: Definir el Schema ANTIGUO aquí temporalmente ---
// Copia la definición exacta de tu schema ANTIGUO de Karma aquí
// para poder leer los datos existentes.
const OldKarmaSchema = new mongoose.Schema(
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
const OldKarma = mongoose.model("old", OldKarmaSchema);
// --- Fin Schema Antiguo ---

const migrate = async () => {
  logger.info("Starting data migration...");
  let connection; // Define connection outside try block

  try {
    logger.info(`Connecting to MongoDB at ${mongoUri}...`);
    // Conectar directamente aquí para el script
    connection = await mongoose.connect(mongoUri, {
      // Opciones de Mongoose 7+ ya no son necesarias aquí generalmente
    });
    logger.info("Database connected successfully for migration.");

    // 1. Leer todos los documentos del modelo antiguo
    logger.info("Fetching all documents from the old 'karmas' collection...");
    const oldKarmaDocs = await OldKarma.find({}).lean(); // Usar lean() para obtener objetos planos
    logger.info(`Found ${oldKarmaDocs.length} documents to migrate.`);

    if (oldKarmaDocs.length === 0) {
      logger.info(
        "No documents found in the old collection. Migration not needed."
      );
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // 2. Iterar y migrar cada documento
    for (const oldDoc of oldKarmaDocs) {
      try {
        // Validación básica del documento antiguo
        if (
          !oldDoc.userId ||
          !oldDoc.groupId ||
          oldDoc.firstName === undefined
        ) {
          logger.warn(
            `Skipping invalid old document: ${JSON.stringify(oldDoc)}`
          );
          errorCount++;
          continue;
        }

        // a) Upsert User
        const userUpdate = {
          $set: {
            // Usar $set para evitar borrar campos existentes si se re-ejecuta
            userName: oldDoc.userName,
            firstName: oldDoc.firstName,
            lastName: oldDoc.lastName,
          },
          // $setOnInsert: { userId: oldDoc.userId } // Podría ser más seguro si userId no debe cambiar
        };
        const userDoc = await User.findOneAndUpdate(
          { userId: oldDoc.userId },
          userUpdate,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // b) Upsert Group
        const groupUpdate = {
          // No establecemos groupName aquí, se hará oportunistamente
          // Podemos establecerlo si ya existe para no borrarlo en re-ejecuciones
          $setOnInsert: { groupId: oldDoc.groupId }, // Solo establecer groupId al crear
        };
        // Opcional: si quieres guardar el último nombre conocido de la data vieja
        if (oldDoc.groupName) {
          // Si tuvieras un campo groupName en el old schema
          groupUpdate.$set = { groupName: oldDoc.groupName };
        }
        const groupDoc = await Group.findOneAndUpdate(
          { groupId: oldDoc.groupId },
          groupUpdate,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // c) Upsert (New) Karma relationship
        const karmaUpdate = {
          $set: {
            karma: oldDoc.karma || 0, // Usar valor o default
            history: oldDoc.history || [],
            givenKarma: oldDoc.givenKarma || 0,
            givenHate: oldDoc.givenHate || 0,
            // Asegurarse de copiar timestamps si es relevante mantener los originales
            // createdAt: oldDoc.createdAt, // Opcional
            // updatedAt: oldDoc.updatedAt, // Opcional
          },
          // No es necesario $setOnInsert aquí si usamos user y group como filtro
        };
        await Karma.findOneAndUpdate(
          { user: userDoc._id, group: groupDoc._id }, // Buscar por las referencias ObjectId
          karmaUpdate,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        migratedCount++;
        if (migratedCount % 100 === 0) {
          // Log every 100 docs
          logger.info(`Migrated ${migratedCount}/${oldKarmaDocs.length}...`);
        }
      } catch (docError) {
        logger.error(
          `Error migrating document for user ${oldDoc.userId} in group ${oldDoc.groupId}:`,
          docError
        );
        errorCount++;
      }
    }

    logger.info("-----------------------------------------");
    logger.info("Migration Summary:");
    logger.info(`Successfully processed/migrated: ${migratedCount}`);
    logger.info(`Skipped/Errored documents: ${errorCount}`);
    logger.info("Migration finished.");
  } catch (error) {
    logger.error("A critical error occurred during migration:", error);
  } finally {
    // 3. Cerrar conexión
    if (connection) {
      await connection.disconnect();
      logger.info("Database connection closed.");
    }
  }
};

// Ejecutar la migración
migrate();
