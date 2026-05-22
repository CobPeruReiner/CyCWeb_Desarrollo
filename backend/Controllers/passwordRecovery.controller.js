const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");

const { validarPassword } = require("../Utils/passwordValidator");
const { enviarCodigoRecuperacion } = require("../Services/mailRecovery");
const { guardarOtp, generarOtp, verificarOtp } = require("../Utils/LoginOtp");
const { resetAttemptsCycWeb } = require("../Utils/LoginAttempt");
const { db } = require("../config/database");

const resetPermitidos = new Set();

const requestPasswordReset = async (req, res) => {
  const { doc } = req.body;

  try {
    const user = await db.query(
      `
      SELECT IDPERSONAL, NOMBRES, EMAIL, IDESTADO
      FROM personal
      WHERE DOC = :doc
      `,
      {
        replacements: { doc },
        type: QueryTypes.SELECT,
      },
    );

    if (!user.length) {
      return res.json({
        status: "0",
        body: "Si el usuario existe se enviará un código",
      });
    }

    const usuario = user[0];

    if (usuario.IDESTADO !== 1) {
      return res.json({
        status: "0",
        body: "Si el usuario existe se enviará un código",
      });
    }

    if (!usuario.EMAIL) {
      return res.json({
        status: "1",
        body: "No tienes correo registrado. Contacta soporte.",
      });
    }

    const otp = generarOtp();

    guardarOtp(`reset:${doc}`, otp);

    const nombre = (usuario.NOMBRES || "").split(" ")[0];

    await enviarCodigoRecuperacion(usuario.EMAIL, nombre, otp);

    return res.json({
      status: "0",
      body: "Se envió un código a tu correo registrado",
    });
  } catch (error) {
    console.error("Error requestPasswordReset:", error);

    return res.status(500).json({
      error: "Error solicitando recuperación",
    });
  }
};

const verifyPasswordOtp = async (req, res) => {
  const { doc, otp } = req.body;

  try {
    const valido = verificarOtp(`reset:${doc}`, otp);

    if (!valido) {
      return res.status(400).json({
        status: "1",
        body: "Código inválido o expirado",
      });
    }

    resetPermitidos.add(doc);

    return res.json({
      status: "0",
      body: "Código verificado",
    });
  } catch (error) {
    console.error("Error verifyPasswordOtp:", error);
    return res.status(500).json({
      error: "Error verificando código",
    });
  }
};

const resetPassword = async (req, res) => {
  const { doc, password } = req.body;

  try {
    if (!resetPermitidos.has(doc)) {
      return res.status(403).json({
        status: "1",
        body: "Debe verificar el código antes de cambiar la contraseña",
      });
    }

    if (!validarPassword(password)) {
      return res.status(400).json({
        status: "1",
        body: "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.",
      });
    }

    const user = await db.query(
      `
      SELECT IDESTADO
      FROM personal
      WHERE DOC = :doc
      `,
      {
        replacements: { doc },
        type: QueryTypes.SELECT,
      },
    );

    if (!user.length || user[0].IDESTADO !== 1) {
      return res.status(403).json({
        status: "1",
        body: "Usuario no habilitado para cambiar contraseña",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `
      UPDATE personal
      SET PASSWORD = :password
      WHERE DOC = :doc
      `,
      {
        replacements: {
          password: hash,
          doc,
        },
      },
    );

    await resetAttemptsCycWeb(doc);

    resetPermitidos.delete(doc);

    return res.json({
      status: "0",
      body: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error resetPassword:", error);

    return res.status(500).json({
      error: "Error actualizando contraseña",
    });
  }
};

module.exports = {
  requestPasswordReset,
  verifyPasswordOtp,
  resetPassword,
};
