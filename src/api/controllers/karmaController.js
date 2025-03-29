const karmaService = require("../../services/karmaService");
const logger = require("../../utils/logger");

/**
 * @description Obtiene todos los usuarios de un grupo específico, ordenados por karma descendente.
 * @route GET /api/karma/group/:groupId
 */
const getUsersByGroupId = async (req, res) => {
  const groupIdParam = req.params.groupId;
  const groupId = parseInt(groupIdParam, 10);

  // Validar que groupId sea un número
  if (isNaN(groupId)) {
    return res
      .status(400)
      .json({ message: "Invalid Group ID format. It must be a number." });
  }

  try {
    // Llamar al servicio para obtener los usuarios, limit=0 para obtener todos
    // false para ordenar descendente (más karma primero)
    const users = await karmaService.getTopKarma(groupId, false, 0);

    if (users === null) {
      // Si el servicio devolvió null, indica un error interno del servicio
      return res
        .status(500)
        .json({ message: "Error retrieving users from the database." });
    }

    if (users.length === 0) {
      // Opcional: devolver 404 si no hay usuarios en ese grupo
      return res
        .status(404)
        .json({ message: `No users found for group ID ${groupId}.` });
    }

    // Enviar la respuesta exitosa
    res.status(200).json(users);
  } catch (error) {
    logger.error(`API Error fetching users for group ${groupId}:`, error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getTotal = async (req, res) => {
  try {
    const total = await karmaService.getTotalUsersAndGroups();
    if (total === null) {
      return res
        .status(500)
        .json({ message: "Error retrieving total users and groups." });
    }
    res.status(200).json(total);
  } catch (error) {
    logger.error("API Error fetching total users and groups:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * @description Obtiene la lista de grupos en los que un usuario tiene registro de karma.
 * @route GET /api/users/:userId/groups
 */
const getUserGroups = async (req, res) => {
  const userIdParam = req.params.userId;
  const userId = parseInt(userIdParam, 10);

  // Validar que userId sea un número
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid User ID format. It must be a number." });
  }

  try {
    // Llamar al servicio para obtener los grupos del usuario
    const groups = await karmaService.getGroupsForUser(userId);

    if (groups === null) {
      // Error interno del servicio
      return res
        .status(500)
        .json({ message: "Error retrieving groups for the user." });
    }

    if (groups.length === 0) {
      // El usuario no fue encontrado o no tiene registros en ningún grupo
      // Devolver 404 es apropiado aquí
      return res
        .status(404)
        .json({
          message: `User with ID ${userId} not found or has no karma records in any group.`,
        });
    }

    // Enviar la respuesta exitosa
    // Mapeamos para quitar el _id si no se quiere exponer en la API
    const responseGroups = groups.map(({ _id, ...rest }) => rest);
    res.status(200).json(responseGroups);
  } catch (error) {
    logger.error(`API Error fetching groups for user ${userId}:`, error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getUsersByGroupId,
  getTotal,
  getUserGroups,
};
