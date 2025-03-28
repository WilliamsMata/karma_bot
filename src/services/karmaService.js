const Karma = require("../models/Karma");
const logger = require("../utils/logger"); // Asumiendo un logger simple

/**
 * Actualiza el karma de un usuario receptor y registra quién lo dio.
 * @param {object} msg - El objeto de mensaje de Telegram.
 * @param {number} incValue - El valor a incrementar/decrementar (+1 o -1).
 * @returns {Promise<{respSender: object, respReceiver: object}|null>} Objeto con los documentos actualizados del emisor y receptor, o null si hay error.
 */
const updateKarma = async (msg, incValue = 1) => {
  try {
    const sender = msg.from;
    const receiver = msg.reply_to_message.from;

    // Determinar qué contador incrementar en el emisor
    const incGivenKarmaOrHate =
      incValue === 1 ? { givenKarma: 1 } : { givenHate: 1 };

    // Usar Promise.all para ejecutar ambas actualizaciones en paralelo
    const [respSender, respReceiver] = await Promise.all([
      // Actualizar o crear el registro del emisor
      Karma.findOneAndUpdate(
        { userId: sender.id, groupId: msg.chat.id },
        {
          $inc: incGivenKarmaOrHate,
          $set: {
            // Usar $set para actualizar datos que no son incrementales
            userName: sender.username,
            firstName: sender.first_name,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true } // setDefaultsOnInsert asegura que los defaults del schema se apliquen en la creación
      ),
      // Actualizar o crear el registro del receptor
      Karma.findOneAndUpdate(
        { userId: receiver.id, groupId: msg.chat.id },
        {
          $inc: { karma: incValue },
          $push: {
            history: {
              // timestamp: Date.now(), // Ya no es necesario si usamos default en el schema
              karmaChange: incValue,
            },
          },
          $set: {
            // Usar $set para actualizar datos que no son incrementales
            userName: receiver.username,
            firstName: receiver.first_name,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);

    return { respSender, respReceiver };
  } catch (error) {
    logger.error(
      `Error updating karma for user ${receiver.id} by user ${sender.id} in group ${msg.chat.id}:`,
      error
    );
    return null;
  }
};

/**
 * Obtiene los N usuarios con más (o menos) karma en un grupo.
 * @param {number} groupId - El ID del grupo de Telegram.
 * @param {boolean} [ascending=false] - Si es true, ordena de menor a mayor karma (más odiados).
 * @param {number} [limit=10] - El número máximo de usuarios a retornar.
 * @returns {Promise<object[]|null>} Un array de usuarios o null si hay error.
 */
const getTopKarma = async (groupId, ascending = false, limit = 10) => {
  try {
    const sortOrder = ascending ? 1 : -1;
    const topKarmaUsers = await Karma.find(
      { groupId, karma: { $exists: true } }, // Asegura que el campo karma exista
      "karma firstName userName userId" // Proyectar campos necesarios explícitamente
    )
      .sort({ karma: sortOrder })
      .limit(limit)
      .lean();

    return topKarmaUsers;
  } catch (error) {
    logger.error(`Error fetching top karma users for group ${groupId}:`, error);
    return null;
  }
};

/**
 * Obtiene los N usuarios que más karma han dado y los N que más odio han dado.
 * @param {number} groupId - El ID del grupo de Telegram.
 * @param {number} [limit=10] - El número máximo de usuarios a retornar por categoría.
 * @returns {Promise<{topGivenKarma: object[], topGivenHate: object[]}|null>} Objeto con los arrays de usuarios o null si hay error.
 */
const getTopGiven = async (groupId, limit = 10) => {
  try {
    const [topGivenKarma, topGivenHate] = await Promise.all([
      Karma.find(
        { groupId, givenKarma: { $gt: 0 } }, // Filtrar solo los que han dado karma > 0
        "givenKarma firstName userName userId"
      )
        .sort({ givenKarma: -1 })
        .limit(limit)
        .lean(),
      Karma.find(
        { groupId, givenHate: { $gt: 0 } }, // Filtrar solo los que han dado odio > 0
        "givenHate firstName userName userId"
      )
        .sort({ givenHate: -1 })
        .limit(limit)
        .lean(),
    ]);

    return { topGivenKarma, topGivenHate };
  } catch (error) {
    logger.error(
      `Error fetching top karma givers for group ${groupId}:`,
      error
    );
    // Devolver objeto con arrays vacíos en caso de error parcial o total es más seguro que null
    return { topGivenKarma: [], topGivenHate: [] };
  }
};

/**
 * Transfiere karma de un usuario a otro dentro del mismo grupo.
 * @param {object} msg - El objeto de mensaje de Telegram (usado para obtener emisor, receptor y grupo).
 * @param {number} quantity - La cantidad de karma a transferir (debe ser positiva).
 * @returns {Promise<{respSender: object, respReceiver: object}|string|null>} Objeto con los documentos actualizados, un string con mensaje de error específico, o null si hay error genérico.
 */
const transferKarma = async (msg, quantity) => {
  // Validación de la cantidad movida aquí para mantener el servicio autocontenido
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return "The amount must be a positive whole number. Ex: /send 10";
  }

  const sender = msg.from;
  const receiver = msg.reply_to_message.from;
  const groupId = msg.chat.id;

  try {
    // 1. Verificar si el emisor tiene suficiente karma (optimizado para leer solo una vez)
    const senderKarmaDoc = await Karma.findOne(
      { userId: sender.id, groupId },
      "karma" // Solo necesitamos el campo karma
    ).lean(); // Usar lean para obtener objeto plano

    // Si el emisor no existe o no tiene karma suficiente
    if (!senderKarmaDoc || senderKarmaDoc.karma < quantity) {
      return `You don't have enough karma. Your current karma is ${
        senderKarmaDoc?.karma ?? 0
      }.`;
    }

    // 2. Realizar la transferencia (si tiene suficiente karma)
    const [respSender, respReceiver] = await Promise.all([
      // Restar karma al emisor y añadir historial
      Karma.findOneAndUpdate(
        { userId: sender.id, groupId },
        {
          $inc: { karma: -quantity },
          $set: { userName: sender.username, firstName: sender.first_name },
          $push: { history: { karmaChange: -quantity } },
        },
        { new: true }
      ),
      // Sumar karma al receptor y añadir historial
      Karma.findOneAndUpdate(
        { userId: receiver.id, groupId },
        {
          $inc: { karma: quantity },
          $set: { userName: receiver.username, firstName: receiver.first_name },
          $push: { history: { karmaChange: quantity } },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);

    return { respSender, respReceiver };
  } catch (error) {
    logger.error(
      `Error transferring karma from ${sender.id} to ${receiver.id} in group ${groupId}:`,
      error
    );
    return null; // Error genérico
  }
};

/**
 * Obtiene los N usuarios que más karma han recibido en un período de tiempo.
 * @param {number} groupId - El ID del grupo de Telegram.
 * @param {number} [daysBack=1] - Número de días hacia atrás para considerar el historial.
 * @param {number} [limit=10] - El número máximo de usuarios a retornar.
 * @returns {Promise<object[]|null>} Un array de usuarios o null si hay error.
 */
async function getTopUsersByKarmaReceived(groupId, daysBack = 1, limit = 10) {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    const topUsers = await Karma.aggregate([
      { $match: { groupId: groupId } }, // Filtrar por grupo
      { $unwind: "$history" }, // Desglosar el array de historial
      {
        $match: {
          // Filtrar historial por fecha y cambio positivo
          "history.timestamp": { $gte: startDate },
          "history.karmaChange": { $gt: 0 }, // Considerar solo karma positivo recibido
        },
      },
      {
        $group: {
          // Agrupar por usuario
          _id: "$userId",
          totalKarmaReceived: { $sum: "$history.karmaChange" },
          userName: { $first: "$userName" }, // Tomar el primer nombre de usuario encontrado
          firstName: { $first: "$firstName" }, // Tomar el primer nombre encontrado
        },
      },
      { $sort: { totalKarmaReceived: -1 } }, // Ordenar por karma recibido
      { $limit: limit }, // Limitar resultados
      {
        // Proyección final para renombrar _id a userId y excluir _id
        $project: {
          _id: 0,
          userId: "$_id",
          totalKarmaReceived: 1,
          userName: 1,
          firstName: 1,
        },
      },
    ]);

    return topUsers;
  } catch (error) {
    logger.error(
      `Error fetching top users by karma received for group ${groupId} (last ${daysBack} days):`,
      error
    );
    return null;
  }
}

/**
 * Obtiene todos los IDs de grupos únicos donde el bot ha registrado karma.
 * @returns {Promise<number[]|null>} Array de IDs de grupo o null si hay error.
 */
const getDistinctGroupIds = async () => {
  try {
    const groupIds = await Karma.distinct("groupId");
    return groupIds;
  } catch (error) {
    logger.error("Error fetching distinct group IDs:", error);
    return null;
  }
};

module.exports = {
  updateKarma,
  getTopKarma,
  getTopGiven,
  transferKarma,
  getTopUsersByKarmaReceived,
  getDistinctGroupIds,
};
