const jwt = require("jsonwebtoken");
const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");
const { verificarOtp } = require("../Utils/LoginOtp");
const { notifyPreviousSession } = require("./Notify");

const verifyOtp = async (req, res) => {
  const { usuario, codigo } = req.body;

  if (!usuario || !codigo) {
    return res.status(200).json({
      status: "1",
      body: "Datos incompletos",
    });
  }

  if (!verificarOtp(usuario, String(codigo))) {
    return res.status(200).json({
      status: "1",
      body: "Código inválido o vencido",
    });
  }

  try {
    const [users] = await db.query(
      `
      SELECT 
        IDPERSONAL,
        APELLIDOS,
        NOMBRES,
        USUARIO,
        ANEXO_BACKUP
      FROM personal
      WHERE DOC = :user AND IDESTADO = 1
      `,
      {
        replacements: { user: usuario },
        type: QueryTypes.SELECT,
      },
    );

    if (!users) {
      return res.status(200).json({
        status: "1",
        body: "Usuario no válido",
      });
    }

    const api_token = jwt.sign(
      { id: users.IDPERSONAL },
      process.env.JWT_SECRET,
      { expiresIn: "11h" },
    );

    // await db.query(
    //   "UPDATE personal SET api_token = :api_token WHERE IDPERSONAL = :IDPERSONAL",
    //   {
    //     replacements: {
    //       api_token,
    //       IDPERSONAL: users.IDPERSONAL,
    //     },
    //     type: QueryTypes.UPDATE,
    //   },
    // );

    notifyPreviousSession(users.IDPERSONAL);

    const clients = await db.query(
      `
        SELECT 
            cartera.cartera AS nombre,
            tabla_log.id AS id_tabla,
            tabla_log.id_cartera AS idcartera,
            cartera.tipo AS tipo_cartera
        FROM tabla_log
        INNER JOIN asignacion_tabla 
          ON tabla_log.id = asignacion_tabla.id_tabla
        INNER JOIN cartera 
          ON tabla_log.id_cartera = cartera.id
        INNER JOIN cliente 
          ON cartera.idcliente = cliente.id
        WHERE asignacion_tabla.id_usuario = :IDPERSONAL
          AND cartera.estado = 1
          AND tabla_log.estado = 0
        ORDER BY cartera.cartera
      `,
      {
        replacements: { IDPERSONAL: users.IDPERSONAL },
        type: QueryTypes.SELECT,
      },
    );

    users.clients = clients;

    return res.status(200).json({
      status: "0",
      body: { ...users, api_token },
    });
  } catch (err) {
    console.error("Error verifyOtp:", err);
    return res.status(500).json({
      status: "1",
      body: "Error al validar código",
    });
  }
};

module.exports = { verifyOtp };
