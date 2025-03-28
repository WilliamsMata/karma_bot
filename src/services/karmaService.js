const User = require("../models/User");
const Group = require("../models/Group");
const Karma = require("../models/Karma"); // Nuevo modelo Karma
const logger = require("../utils/logger");

// --- Helper para encontrar/crear Grupo y actualizar nombre ---
const findOrCreateGroup = async (groupId, groupName = null) => {
  const updateData = { $setOnInsert: { groupId } };
  if (groupName) {
    // Actualiza el nombre solo si se proporciona (población oportunista)
    updateData.$set = { groupName };
  }
  return Group.findOneAndUpdate({ groupId }, updateData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).lean(); // Usamos lean aquí porque solo necesitamos el _id o leer datos
};

// --- Helper para encontrar/crear Usuario ---
const findOrCreateUser = async (userData) => {
  const updateData = {
    $set: {
      // Siempre actualiza nombres/username por si cambian
      firstName: userData.first_name,
      lastName: userData.last_name,
      userName: userData.username,
    },
    $setOnInsert: { userId: userData.id }, // Asegura userId al crear
  };
  return User.findOneAndUpdate({ userId: userData.id }, updateData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).lean(); // Usamos lean aquí porque solo necesitamos el _id o leer datos
};

/**
 * Actualiza el karma de un usuario receptor y registra quién lo dio.
 * @param {object} msg - El objeto de mensaje de Telegram.
 *   msg.from: Emisor
 *   msg.reply_to_message.from: Receptor
 *   msg.chat: Grupo (contiene id y title)
 * @param {number} incValue - El valor a incrementar/decrementar (+1 o -1).
 * @returns {Promise<{senderKarma: object, receiverKarma: object}|null>} Objeto con los documentos Karma poblados o null si hay error.
 */
const updateKarma = async (msg, incValue = 1) => {
  try {
    const senderData = msg.from;
    const receiverData = msg.reply_to_message.from;
    const chatData = msg.chat;

    // 1. Encontrar/Crear Grupo y Usuarios
    const [groupDoc, senderUserDoc, receiverUserDoc] = await Promise.all([
      findOrCreateGroup(chatData.id, chatData.title),
      findOrCreateUser(senderData),
      findOrCreateUser(receiverData),
    ]);

    // 2. Actualizar Karma (Emisor y Receptor)
    const incGivenKarmaOrHate =
      incValue === 1 ? { givenKarma: 1 } : { givenHate: 1 };

    const [senderKarma, receiverKarma] = await Promise.all([
      // Actualizar Emisor (solo contadores given*)
      Karma.findOneAndUpdate(
        { user: senderUserDoc._id, group: groupDoc._id },
        { $inc: incGivenKarmaOrHate },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .populate("user", "firstName userName userId") // Poblar usuario
        .populate("group", "groupName groupId"), // Poblar grupo

      // Actualizar Receptor (karma y historial)
      Karma.findOneAndUpdate(
        { user: receiverUserDoc._id, group: groupDoc._id },
        {
          $inc: { karma: incValue },
          $push: { history: { karmaChange: incValue, timestamp: new Date() } }, // Asegurar timestamp
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .populate("user", "firstName userName userId") // Poblar usuario
        .populate("group", "groupName groupId"), // Poblar grupo
    ]);

    // Devolvemos los documentos Karma poblados
    return { senderKarma, receiverKarma };
  } catch (error) {
    logger.error(
      `Error updating karma for user ${msg.reply_to_message.from.id} by user ${msg.from.id} in group ${msg.chat.id}:`,
      error
    );
    return null;
  }
};

/**
 * Obtiene los N usuarios con más (o menos) karma en un grupo.
 * @param {number} groupId - El ID numérico del grupo de Telegram.
 * @param {boolean} [ascending=false] - Si es true, ordena de menor a mayor karma (más odiados).
 * @param {number} [limit=10] - El número máximo de usuarios a retornar. Si es 0 o menor, retorna todos.
 * @returns {Promise<object[]|null>} Un array de documentos Karma poblados con usuario o null si hay error.
 */
const getTopKarma = async (groupId, ascending = false, limit = 10) => {
  try {
    // 1. Buscar el _id del grupo
    const groupDoc = await Group.findOne({ groupId }).lean();
    if (!groupDoc) {
      logger.warn(`getTopKarma: Group not found with ID ${groupId}`);
      return []; // Devolver array vacío si el grupo no existe en la DB
    }

    const sortOrder = ascending ? 1 : -1;
    const query = Karma.find({ group: groupDoc._id }) // Buscar por la referencia al grupo
      .sort({ karma: sortOrder })
      .populate("user", "firstName userName userId") // Poblar datos del usuario necesarios
      // No poblamos 'group' aquí, ya lo conocemos
      .select("karma user givenKarma givenHate"); // Seleccionar solo karma y el usuario poblado

    if (limit && typeof limit === "number" && limit > 0) {
      query.limit(limit);
    }

    const topKarmaUsers = await query.lean(); // Usar lean después de populate

    // Mapear para que la estructura sea similar a la anterior si es necesario por los handlers
    // O simplemente devolver topKarmaUsers si los handlers se adaptan
    return topKarmaUsers.map((k) => ({
      karma: k.karma,
      userId: k.user?.userId, // Acceder a través del objeto 'user' poblado
      firstName: k.user?.firstName,
      userName: k.user?.userName,
      givenKarma: k.givenKarma,
      givenHate: k.givenHate,
      _id: k._id, // El _id del documento Karma
    }));
    // return topKarmaUsers; // Alternativa si adaptas los handlers
  } catch (error) {
    logger.error(`Error fetching top karma users for group ${groupId}:`, error);
    return null;
  }
};

/**
 * Obtiene los N usuarios que más karma han dado y los N que más odio han dado en un grupo.
 * @param {number} groupId - El ID numérico del grupo de Telegram.
 * @param {number} [limit=10] - El número máximo de usuarios a retornar por categoría.
 * @returns {Promise<{topGivenKarma: object[], topGivenHate: object[]}|null>} Objeto con arrays de documentos Karma poblados.
 */
const getTopGiven = async (groupId, limit = 10) => {
  try {
    // 1. Buscar el _id del grupo
    const groupDoc = await Group.findOne({ groupId }).lean();
    if (!groupDoc) {
      logger.warn(`getTopGiven: Group not found with ID ${groupId}`);
      return { topGivenKarma: [], topGivenHate: [] };
    }

    const [topGivenKarmaDocs, topGivenHateDocs] = await Promise.all([
      Karma.find({ group: groupDoc._id, givenKarma: { $gt: 0 } })
        .sort({ givenKarma: -1 })
        .limit(limit)
        .populate("user", "firstName userName userId")
        .select("givenKarma user")
        .lean(), // Lean después de populate
      Karma.find({ group: groupDoc._id, givenHate: { $gt: 0 } })
        .sort({ givenHate: -1 })
        .limit(limit)
        .populate("user", "firstName userName userId")
        .select("givenHate user")
        .lean(), // Lean después de populate
    ]);

    // Mapear para estructura esperada por los handlers (similar a getTopKarma)
    const mapResults = (docs, field) =>
      docs.map((k) => ({
        [field]: k[field],
        userId: k.user?.userId,
        firstName: k.user?.firstName,
        userName: k.user?.userName,
        _id: k._id,
      }));

    return {
      topGivenKarma: mapResults(topGivenKarmaDocs, "givenKarma"),
      topGivenHate: mapResults(topGivenHateDocs, "givenHate"),
    };
  } catch (error) {
    logger.error(
      `Error fetching top karma givers for group ${groupId}:`,
      error
    );
    return { topGivenKarma: [], topGivenHate: [] }; // Devolver arrays vacíos en caso de error
  }
};

/**
 * Transfiere karma de un usuario a otro dentro del mismo grupo.
 * @param {object} msg - El objeto de mensaje de Telegram.
 * @param {number} quantity - La cantidad de karma a transferir (positiva).
 * @returns {Promise<{senderKarma: object, receiverKarma: object}|string|null>} Objeto con documentos Karma poblados, string de error, o null.
 */
const transferKarma = async (msg, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return "The amount must be a positive whole number.";
  }

  const senderData = msg.from;
  const receiverData = msg.reply_to_message.from;
  const chatData = msg.chat;
  const groupId = chatData.id; // Numérico

  // Usar una sesión de Mongoose para transacción (opcional pero recomendado para atomicidad)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Encontrar/Crear Grupo (y actualizar nombre) - DENTRO de la transacción
    const [groupDoc, senderUserDoc, receiverUserDoc] = await Promise.all([
      findOrCreateGroup(groupId, chatData.title),
      findOrCreateUser(senderData),
      findOrCreateUser(receiverData),
    ]);

    // 3. Encontrar los documentos Karma de ambos - DENTRO de la transacción
    // Buscar sin upsert, ya que si no existen, la lógica es diferente (no se puede transferir desde 0)
    const senderKarmaDoc = await Karma.findOne({
      user: senderUserDoc._id,
      group: groupDoc._id,
    }).session(session); // Asociar con la sesión

    // 4. Validar fondos del emisor
    if (!senderKarmaDoc || senderKarmaDoc.karma < quantity) {
      await session.abortTransaction(); // Abortar transacción
      session.endSession();
      return `You don't have enough karma. Your current karma is ${
        senderKarmaDoc?.karma ?? 0
      }.`;
    }

    // 5. Realizar la transferencia (Actualizar ambos documentos Karma)
    // Restar al emisor
    senderKarmaDoc.karma -= quantity;
    senderKarmaDoc.history.push({
      karmaChange: -quantity,
      timestamp: new Date(),
    });
    await senderKarmaDoc.save({ session }); // Guardar DENTRO de la sesión

    // Sumar al receptor (o crear su doc Karma si no existe)
    const receiverKarmaDoc = await Karma.findOneAndUpdate(
      { user: receiverUserDoc._id, group: groupDoc._id },
      {
        $inc: { karma: quantity },
        $push: { history: { karmaChange: quantity, timestamp: new Date() } },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, session: session } // Upsert y asociar con sesión
    );

    // 6. Confirmar la transacción
    await session.commitTransaction();
    session.endSession();

    // 7. Poblar los resultados para devolverlos (fuera de la transacción)
    const [populatedSender, populatedReceiver] = await Promise.all([
      Karma.findById(senderKarmaDoc._id)
        .populate("user", "firstName userName userId")
        .populate("group", "groupName groupId")
        .lean(),
      Karma.findById(receiverKarmaDoc._id)
        .populate("user", "firstName userName userId")
        .populate("group", "groupName groupId")
        .lean(),
    ]);

    return { senderKarma: populatedSender, receiverKarma: populatedReceiver };
  } catch (error) {
    logger.error(
      `Error transferring karma from ${senderData.id} to ${receiverData.id} in group ${groupId}:`,
      error
    );
    // Si hubo error, abortar transacción si está activa
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return null; // Error genérico
  }
};

/**
 * Obtiene los N usuarios que más karma han recibido en un período de tiempo en un grupo.
 * @param {number} groupId - El ID numérico del grupo de Telegram.
 * @param {number} [daysBack=1] - Número de días hacia atrás.
 * @param {number} [limit=10] - Límite de usuarios.
 * @returns {Promise<object[]|null>} Array con { user, totalKarmaReceived } o null.
 */
async function getTopUsersByKarmaReceived(groupId, daysBack = 1, limit = 10) {
  try {
    // 1. Buscar el _id del grupo
    const groupDoc = await Group.findOne({ groupId }).lean();
    if (!groupDoc) {
      logger.warn(
        `getTopUsersByKarmaReceived: Group not found with ID ${groupId}`
      );
      return [];
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    const topUsersData = await Karma.aggregate([
      { $match: { group: groupDoc._id } }, // Filtrar por _id del grupo
      { $unwind: "$history" },
      {
        $match: {
          "history.timestamp": { $gte: startDate },
          "history.karmaChange": { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$user", // Agrupar por la referencia ObjectId al usuario
          totalKarmaReceived: { $sum: "$history.karmaChange" },
        },
      },
      { $sort: { totalKarmaReceived: -1 } },
      { $limit: limit },
      {
        // Hacer $lookup para obtener datos del usuario
        $lookup: {
          from: "users", // El nombre de la colección de usuarios (usualmente plural y minúsculas)
          localField: "_id", // El campo en Karma (resultado del $group)
          foreignField: "_id", // El campo en Users
          as: "userDetails", // Nombre del array donde se guarda el resultado del lookup
        },
      },
      {
        // Desenrollar el array (lookup devuelve array, aunque esperamos 1 resultado)
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }, // preservar si el usuario no se encontrara
      },
      {
        // Proyectar el formato final deseado
        $project: {
          _id: 0, // Excluir el _id del group stage
          totalKarmaReceived: 1,
          userId: "$userDetails.userId", // Acceder a los campos dentro de userDetails
          firstName: "$userDetails.firstName",
          userName: "$userDetails.userName",
          // Incluir el _id del usuario si se necesita
          // userObjectId: "$_id"
        },
      },
    ]);

    return topUsersData;
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
 * @returns {Promise<number[]|null>} Array de IDs numéricos de grupo o null si hay error.
 */
const getDistinctGroupIds = async () => {
  try {
    // Ahora consultamos la colección de Grupos
    const groups = await Group.find({}, "groupId").lean(); // Obtener solo el groupId
    return groups.map((g) => g.groupId);
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
