const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

// aña
const getAllAcciones = async (req, res) => {
  try {
    const query = `SELECT * FROM accion`;

    const acciones = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    res.status(200).json(acciones);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getAllAcciones", detalle: error.message });
  }
};

const getAccioneTipo = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID de accion no proporcionado" });
  }

  try {
    const query = `
      SELECT * FROM accion
      WHERE TIPO = :tipo
      AND IDESTADO = 1
    `;

    const acciones = await db.query(query, {
      replacements: { tipo: id },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(acciones);
  } catch (error) {
    res.status(500).json({
      error: "Error en getAccion",
      detalle: error.message,
    });
  }
};

const getAccionTipoCartera = async (req, res) => {
  const { idTipo, idTabla } = req.params;

  if (!idTipo || !idTabla) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
  }

  try {
    const query = `SELECT id_cartera FROM tabla_log WHERE id = :idTabla`;
    const idCartera = await db.query(query, {
      replacements: { idTabla },
      type: QueryTypes.SELECT,
    });

    if (!idCartera.length) {
      return res.status(404).json({ error: "Cartera no encontrada" });
    }

    const id_cartera = idCartera[0].id_cartera;

    const query2 = `
    SELECT * FROM accion
    WHERE TIPO = :idTipo
    AND idcartera = :idCartera
    AND IDESTADO = 1
  `;

    const acciones = await db.query(query2, {
      replacements: { idTipo, idCartera: id_cartera },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(acciones);
  } catch (error) {
    res.status(500).json({
      error: "Error en getAccion",
      detalle: error.message,
    });
  }
};

module.exports = {
  getAllAcciones,
  getAccioneTipo,
  getAccionTipoCartera,
};
