const karmaService = require("../../services/karmaService");
const logger = require("../../utils/logger");

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
  getUserGroups,
};
