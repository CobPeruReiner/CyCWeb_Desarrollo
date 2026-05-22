const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

const getCategoria = async (req, res) => {
  try {
    const query = `SELECT * FROM categoria WHERE IDESTADO = 1`;

    const categorias = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    res.status(200).json(categorias);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getCategoria", detalle: error.message });
  }
};

module.exports = { getCategoria };
