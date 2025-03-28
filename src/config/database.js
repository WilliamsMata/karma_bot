const mongoose = require("mongoose");
const { mongoUri } = require("./environment");
const logger = require("../utils/logger");

mongoose.set("strictQuery", false);

/**
 * Establece la conexión con la base de datos MongoDB.
 * @returns {Promise<void>} Promesa que se resuelve cuando la conexión es exitosa.
 * @throws {Error} Si ocurre un error durante la conexión.
 */
const dbConnection = async () => {
  try {
    await mongoose.connect(mongoUri);
    logger.info("Database connected successfully.");
  } catch (error) {
    logger.error("Database connection error:", error);
    throw new Error("Error when starting the database");
  }
};

module.exports = {
  dbConnection,
};
