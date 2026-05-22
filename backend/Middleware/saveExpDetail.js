const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");

// MIDDLEWARE PARA VERIFICAR EL 'solicitudCautelar'
// SI ES "DENTRO DEL PROCESO" (2) SE DEBE LLAMAR AL ULTIMO DETALLE DE LA DEMANDA RELACIONADO AL EXPEDIENTE
// SI ES "FUERA DEL PROCESO" (1) SE DEBE CREAR UN DETALLE DE LA DEMANDA RELACIONADO AL EXPEDIENTE
const saveDemandaDetMiddleware = async (req, res, next) => {
  const {
    SJIdDemandaDet,
    solicitudCautelar,
    SJIdExpediente,
    usuarioReg,
    SJFechaReg,
    juzgadoDemandaSC,
    nroExpedienteDemandaSC,
    calDemandaSC,
    observacionDemandaSC,
    fechaCalDemandaSC,
    tipoEscritoCalDemandaSC,
    observacionCalDemandaSC,
  } = req.body;

  const limpiarCampo = (valor) => {
    if (Array.isArray(valor)) {
      return valor.find((v) => v);
    }
    return valor || null;
  };

  if (!idExpediente || !solicitudCautelar) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan datos para procesar la demanda",
    });
  }

  try {
    let idDemandaDet = null;

    if (parseInt(solicitudCautelar) === 2) {
      if (!SJIdDemandaDet) {
        return res.status(400).json({
          ok: false,
          mensaje: "Falta el parámetro SJIdDemandaDet para actualizar.",
        });
      }

      await db.query(
        `
        UPDATE SJ_DemandaDet
        SET 
          SJNumeroExpediente = :nroExpedienteDemandaSC,
          SJJuzgado = :juzgadoDemandaSC
        WHERE SJIdDemandaDet = :SJIdDemandaDet
        `,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            SJIdDemandaDet,
            nroExpedienteDemandaSC: limpiarCampo(nroExpedienteDemandaSC),
            juzgadoDemandaSC: limpiarCampo(juzgadoDemandaSC),
          },
        },
      );
    } else if (parseInt(solicitudCautelar) === 1) {
      // Crear nuevo detalle de demanda
      const adjuntoCalDemandaSC = req.files?.adjuntoCalDemandaSC?.[0]?.filename
        ? `/Adjuntos/Demanda/${req.files.adjuntoCalDemandaSC[0].filename}`
        : null;

      const [insertResult] = await db.query(
        `
        INSERT INTO SJ_DemandaDet (
          SJIdExpediente,
          SJFechaDemanda,
          SJIdDemanda,
          SJTipoEscrito,
          SJObservacion,
          SJDemandaAdjunto,
          SJFechaReg,
          SJUsuarioReg,
          SJEstado,
          SJJuzgado,
          SJNumeroExpediente,
          SJObservacionCal
        )
        VALUES (
          :idExpediente,
          :fechaCalDemandaSC,
          :calDemandaSC,
          :tipoEscritoCalDemandaSC,
          :observacionDemandaSC,
          :adjuntoCalDemandaSC,
          :SJFechaReg,
          :usuarioReg,
          1,
          :juzgadoDemandaSC,
          :nroExpedienteDemandaSC,
          :observacionCalDemandaSC
        )
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            idExpediente: 1,
            fechaCalDemandaSC: limpiarCampo(fechaCalDemandaSC),
            calDemandaSC: limpiarCampo(calDemandaSC),
            tipoEscritoCalDemandaSC: limpiarCampo(tipoEscritoCalDemandaSC),
            observacionDemandaSC: limpiarCampo(observacionDemandaSC),
            adjuntoCalDemandaSC: limpiarCampo(adjuntoCalDemandaSC),
            SJFechaReg: limpiarCampo(SJFechaReg),
            usuarioReg: limpiarCampo(usuarioReg),
            juzgadoDemandaSC: limpiarCampo(juzgadoDemandaSC),
            nroExpedienteDemandaSC: limpiarCampo(nroExpedienteDemandaSC),
            observacionCalDemandaSC: limpiarCampo(observacionCalDemandaSC),
          },
        },
      );

      idDemandaDet = insertResult;
    }

    next();
  } catch (error) {
    console.error("Error en saveDemandaDet:", error);

    return res.status(500).json({
      ok: false,
      error: "Error en saveDemandaDet",
      detalle: error.message,
    });
  }
};

module.exports = {
  saveDemandaDetMiddleware,
};
