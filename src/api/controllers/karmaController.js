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
    const [groupInfo, users] = await Promise.all([
      karmaService.getGroupInfo(groupId),
      karmaService.getTopKarma(groupId, false, 0),
    ]);

    if (users === null) {
      // Si el servicio devolvió null, indica un error interno del servicio
      return res
        .status(500)
        .json({ message: "Error retrieving group info from the database." });
    }

    if (!groupInfo) {
      // Opcional: devolver 404 si el grupo no existe
      return res
        .status(404)
        .json({ message: `Group ID ${groupId} not found.` });
    }

    // Enviar la respuesta exitosa
    res.status(200).json({
      groupInfo,
      users,
    });
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

module.exports = {
  getUsersByGroupId,
  getTotal,
};
