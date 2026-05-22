const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

const getContactoEfecto = async (req, res) => {
  const { efecto } = req.params;

  if (!efecto) {
    return res.status(400).json({ error: "Efecto no proporcionado" });
  }

  try {
    const query = `
      SELECT * FROM contacto
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
      .json({ error: "Error en getContactoEfecto", detalle: error.message });
  }
};

module.exports = { getContactoEfecto };
