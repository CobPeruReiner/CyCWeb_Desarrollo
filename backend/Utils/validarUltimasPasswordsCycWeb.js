const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

const normalizarHashBcrypt = (hash) => {
  if (!hash) return hash;

  if (hash.startsWith("$2y$")) {
    return "$2b$" + hash.slice(4);
  }

  return hash;
};

const esHashBcrypt = (hash) => {
  return (
    hash?.startsWith("$2a$") ||
    hash?.startsWith("$2b$") ||
    hash?.startsWith("$2y$")
  );
};

const generarMd5 = (texto) => {
  return crypto.createHash("md5").update(texto).digest("hex");
};

const validarPasswordContraHash = async (passwordPlano, hashGuardado) => {
  if (esHashBcrypt(hashGuardado)) {
    return bcrypt.compare(passwordPlano, normalizarHashBcrypt(hashGuardado));
  }

  return generarMd5(passwordPlano) === hashGuardado;
};

const validarUltimasPasswords = async (idUsuario, nuevaPassword) => {
  const historial = await db.query(
    `
    SELECT CONTRASENA
    FROM HISTORIAL_CAMBIOS_CONTRASENA
    WHERE ID_USUARIO = :idUsuario
    ORDER BY ID_HIST_CAMBIO_CONTRASENA DESC
    LIMIT 10
    `,
    {
      replacements: { idUsuario },
      type: QueryTypes.SELECT,
    },
  );

  for (const item of historial) {
    const coincide = await validarPasswordContraHash(
      nuevaPassword,
      item.CONTRASENA,
    );

    if (coincide) return false;
  }

  return true;
};

module.exports = {
  validarUltimasPasswords,
  validarPasswordContraHash,
};
