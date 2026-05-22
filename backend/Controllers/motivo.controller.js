const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

const MotivoListEfecto = async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      error: "Se requiere un array de IDs de efecto",
    });
  }

  try {
    const query = `
    SELECT * FROM motivo
    WHERE IDEFECTO IN (:ids)
    `;

    const contacto = await db.query(query, {
      replacements: { ids },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(contacto);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en AccionListAccion", detalle: error.message });
  }
};

const getMotivoEfecto = async (req, res) => {
  const { efecto } = req.params;

  if (!efecto) {
    return res.status(400).json({ error: "Efecto no proporcionado" });
  }

  try {
    const query = `
      SELECT * FROM motivo
      WHERE IDEFECTO = :efecto
      AND IDESTADO = 1
    `;

    const contacto = await db.query(query, {
      replacements: { efecto },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(contacto);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getMotivoEfecto", detalle: error.message });
  }
};

module.exports = {
  getMotivoEfecto,
  MotivoListEfecto,
};
