const { db } = require("../config/database");

const getTelefonosCompanie = async (_req, res) => {
  try {
    const [companies] = await db.query(
      "SELECT id, nombre FROM operador WHERE estado = 1",
    );

    return res.status(200).json(companies);
  } catch (error) {
    console.error("Error al obtener operadores:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { getTelefonosCompanie };
