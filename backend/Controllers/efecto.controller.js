const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

const getEfectoAccion = async (req, res) => {
  const { accion } = req.params;

  if (!accion) {
    return res.status(400).json({ error: "Accion no proporcionado" });
  }

  try {
    const query = `
      SELECT
        E.*,
        C.CATEGORIA,
        CA.tipo AS tipo_cartera,

        CASE 
          WHEN E.IDCATEGORIA IN (5,11) THEN 1
          ELSE 0
        END AS flag_contacto,

        CASE 
          WHEN LOWER(E.EFECTO) LIKE '%recla%' THEN 1
          ELSE 0
        END AS flag_reclamo

      FROM efecto E
      JOIN accion A ON A.IDACCION = E.IDACCION
      JOIN cartera CA ON CA.id = A.idcartera
      LEFT JOIN categoria C ON C.IDCATEGORIA = E.IDCATEGORIA

      WHERE E.IDACCION = :accion
      AND E.IDESTADO = 1

      ORDER BY E.EFECTO ASC;
    `;

    const contacto = await db.query(query, {
      replacements: { accion },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(contacto);
  } catch (error) {
    res.status(500).json({
      error: "Error en getEfectoAccion",
      detalle: error.message,
    });
  }
};

const AccionListAccion = async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      error: "Se requiere un array de IDs de acción",
    });
  }

  try {
    const query = `
      SELECT * FROM efecto
      WHERE IDACCION IN (:ids)
      ORDER BY ORDEN ASC, EFECTO ASC
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

module.exports = {
  getEfectoAccion,
  AccionListAccion,
};
