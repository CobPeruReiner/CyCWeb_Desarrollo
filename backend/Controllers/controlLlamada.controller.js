const { db } = require("../config/database");
const { QueryTypes } = require("sequelize");

const iniciarLlamada = async (req, res) => {
  console.log("[iniciarLlamada] ===== INICIO =====");
  console.log("[iniciarLlamada] body recibido:", req.body);

  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      console.error("[iniciarLlamada] body inválido o vacío:", data);
      return res.status(400).json({ error: "Body inválido" });
    }

    if (!data.ID_LLAMADA) {
      console.error("[iniciarLlamada] Falta ID_LLAMADA");
      return res.status(400).json({ error: "ID_LLAMADA requerido" });
    }

    console.log(
      "[iniciarLlamada] Validaciones OK. Buscando duplicado por ID_LLAMADA:",
      data.ID_LLAMADA,
    );

    const existe = await db.query(
      `SELECT ID_HISTORIAL_LLAMADAS_SIN_GESTION
       FROM HISTORIAL_LLAMADAS_SIN_GESTION
       WHERE ID_LLAMADA_VICIDAL = :call_id
       LIMIT 1`,
      {
        replacements: { call_id: data.ID_LLAMADA },
        type: QueryTypes.SELECT,
      },
    );

    console.log("[iniciarLlamada] Resultado búsqueda duplicado:", existe);

    if (existe.length > 0) {
      console.log(
        "[iniciarLlamada] Registro duplicado encontrado. Se reutiliza ID:",
        existe[0].ID_HISTORIAL_LLAMADAS_SIN_GESTION,
      );
      return res.json({
        ok: true,
        id: existe[0].ID_HISTORIAL_LLAMADAS_SIN_GESTION,
        duplicado: true,
      });
    }

    console.log(
      "[iniciarLlamada] No existe duplicado. Insertando nueva llamada...",
    );
    console.log("[iniciarLlamada] Payload insert:", data);

    const result = await db.query(
      `INSERT INTO HISTORIAL_LLAMADAS_SIN_GESTION
      (FECHA_LLAMADA, ANEXO_ASESOR, DOCUMENTO_ASESOR, TELEFONO_CLIENTE,
       DOCUMENTO_CLIENTE, IP_VICIDIAL, ID_LLAMADA_VICIDAL,
       ID_GESTION, REQUIERE_GESTION, GESTION_GUARDADA,
       MOTIVO_DE_CORTE, ESTADO_REVISION, TIPO_MARCACION)
      VALUES
      (:FECHA_LLAMADA, :ANEXO_ASESOR, :DOCUMENTO_ASESOR, :TELEFONO_CLIENTE,
       :DOCUMENTO_CLIENTE, :IP_VICIDIAL, :ID_LLAMADA,
       NULL, :REQUIERE_GESTION, 0,
       :MOTIVO_DE_CORTE, 0, :TIPO_MARCACION)`,
      {
        replacements: data,
        type: QueryTypes.INSERT,
      },
    );

    console.log("[iniciarLlamada] Insert ejecutado. Resultado raw:", result);
    console.log("[iniciarLlamada] ID generado:", result[0]);
    console.log("[iniciarLlamada] ===== FIN OK =====");

    return res.json({
      ok: true,
      id: result[0],
    });
  } catch (error) {
    console.error("[iniciarLlamada] ===== ERROR =====");
    console.error("[iniciarLlamada] message:", error?.message);
    console.error("[iniciarLlamada] stack:", error?.stack);
    console.error("[iniciarLlamada] error completo:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};

const marcarGestion = async (req, res) => {
  console.log("[marcarGestion] ===== INICIO =====");
  console.log("[marcarGestion] body recibido:", req.body);

  try {
    const { id, id_gestion } = req.body || {};

    console.log("[marcarGestion] id:", id);
    console.log("[marcarGestion] id_gestion:", id_gestion);

    if (!id) {
      console.error("[marcarGestion] Falta id");
      return res.status(400).json({ error: "ID requerido" });
    }

    if (!id_gestion) {
      console.error("[marcarGestion] Falta id_gestion");
      return res.status(400).json({ error: "ID de gestión requerido" });
    }

    console.log("[marcarGestion] Validaciones OK. Buscando registro...");

    const existe = await db.query(
      `
        SELECT ID_HISTORIAL_LLAMADAS_SIN_GESTION, GESTION_GUARDADA
        FROM HISTORIAL_LLAMADAS_SIN_GESTION
        WHERE ID_HISTORIAL_LLAMADAS_SIN_GESTION = :id
        LIMIT 1
      `,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      },
    );

    console.log("[marcarGestion] Resultado búsqueda:", existe);

    if (existe.length === 0) {
      console.error("[marcarGestion] Registro no encontrado para id:", id);
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    if (existe[0].GESTION_GUARDADA === 1) {
      console.log(
        "[marcarGestion] Registro ya estaba marcado como gestionado. Se ignora.",
      );
      return res.json({ ok: true, ignored: true });
    }

    console.log(
      "[marcarGestion] Actualizando registro con GESTION_GUARDADA=1 e ID_GESTION...",
    );
    console.log("[marcarGestion] replacements update:", { id, id_gestion });

    const resultUpdate = await db.query(
      `UPDATE HISTORIAL_LLAMADAS_SIN_GESTION
       SET
         GESTION_GUARDADA = 1,
         ID_GESTION = :id_gestion
       WHERE ID_HISTORIAL_LLAMADAS_SIN_GESTION = :id`,
      {
        replacements: { id, id_gestion },
        type: QueryTypes.UPDATE,
      },
    );

    console.log("[marcarGestion] Resultado update raw:", resultUpdate);
    console.log("[marcarGestion] ===== FIN OK =====");

    return res.json({ ok: true });
  } catch (error) {
    console.error("[marcarGestion] ===== ERROR =====");
    console.error("[marcarGestion] message:", error?.message);
    console.error("[marcarGestion] stack:", error?.stack);
    console.error("[marcarGestion] error completo:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};

const noGestion = async (req, res) => {
  console.log("[noGestion] ===== INICIO =====");
  console.log("[noGestion] headers:", req.headers);
  console.log("[noGestion] body recibido raw:", req.body);

  try {
    let data = req.body;

    if (typeof data === "string") {
      console.log(
        "[noGestion] body viene como string. Intentando parsear JSON...",
      );
      try {
        data = JSON.parse(data);
        console.log("[noGestion] body parseado correctamente:", data);
      } catch (e) {
        console.error("[noGestion] Error parseando body string:", e?.message);
        return res.status(400).json({ error: "Body inválido" });
      }
    }

    console.log("[noGestion] data final:", data);

    const { id, motivo } = data || {};

    console.log("[noGestion] id:", id);
    console.log("[noGestion] motivo:", motivo);

    if (!id) {
      console.error("[noGestion] Falta id");
      return res.status(400).json({ error: "ID requerido" });
    }

    console.log("[noGestion] Validaciones OK. Buscando registro...");

    const existe = await db.query(
      `SELECT ID_HISTORIAL_LLAMADAS_SIN_GESTION, GESTION_GUARDADA, MOTIVO_DE_CORTE
       FROM HISTORIAL_LLAMADAS_SIN_GESTION
       WHERE ID_HISTORIAL_LLAMADAS_SIN_GESTION = :id
       LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      },
    );

    console.log("[noGestion] Resultado búsqueda:", existe);

    if (existe.length === 0) {
      console.error("[noGestion] Registro no encontrado para id:", id);
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    const registro = existe[0];

    if (registro.GESTION_GUARDADA === 1) {
      console.log("[noGestion] Registro ya gestionado. No se actualiza.");
      return res.json({ ok: true, ignored: true });
    }

    const motivoBase = (registro.MOTIVO_DE_CORTE || "").trim();
    const motivoCierre = (motivo || "CIERRE SIN GESTION").trim();

    let motivoFinal = motivoBase;

    if (!motivoBase) {
      motivoFinal = motivoCierre;
    } else if (!motivoBase.includes(motivoCierre)) {
      motivoFinal = `${motivoBase} | ${motivoCierre}`;
    }

    console.log("[noGestion] motivoBase:", motivoBase);
    console.log("[noGestion] motivoCierre:", motivoCierre);
    console.log("[noGestion] motivoFinal:", motivoFinal);

    const resultUpdate = await db.query(
      `UPDATE HISTORIAL_LLAMADAS_SIN_GESTION
       SET
         MOTIVO_DE_CORTE = :motivoFinal,
         ESTADO_REVISION = 0
       WHERE ID_HISTORIAL_LLAMADAS_SIN_GESTION = :id`,
      {
        replacements: {
          id,
          motivoFinal,
        },
        type: QueryTypes.UPDATE,
      },
    );

    console.log("[noGestion] Resultado update raw:", resultUpdate);
    console.log("[noGestion] ===== FIN OK =====");

    return res.json({ ok: true, motivoFinal });
  } catch (error) {
    console.error("[noGestion] ===== ERROR =====");
    console.error("[noGestion] message:", error?.message);
    console.error("[noGestion] stack:", error?.stack);
    console.error("[noGestion] error completo:", error);
    return res.status(500).json({ error: "Error interno" });
  }
};

module.exports = {
  iniciarLlamada,
  noGestion,
  marcarGestion,
};
