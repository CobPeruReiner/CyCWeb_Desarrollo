const dotenv = require("dotenv");
const { QueryTypes } = require("sequelize");
const { db } = require("../config/database");
const moment = require("moment-timezone");
const axios = require("axios");
const https = require("https");

dotenv.config({ path: "./.env" });

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const getGuiTable = async (req, res) => {
  const { idTable } = req.params;

  if (!idTable) {
    return res.status(400).json({ error: "ID de tabla no proporcionado" });
  }

  try {
    const query = `
    SELECT 
        g.campo AS field, 
        g.alias AS header, 
        g.gui AS table_name,
        g.color, 
        g.type, 
        g.width 
    FROM gui_table AS g 
    WHERE g.id_table = :idTabla 
    ORDER BY g.orden ASC
`;

    const guiTable = await db.query(query, {
      replacements: { idTabla: idTable },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(guiTable);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getGuiTable", detalle: error.message });
  }
};

const getGestionByIdentificador = async (req, res) => {
  const { filter, id_table } = req.body;

  if (!id_table) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
  }

  try {
    const tablaLogQuery = `SELECT nombre FROM tabla_log WHERE id = :id_table`;
    const tablaLog = await db.query(tablaLogQuery, {
      replacements: { id_table },
      type: QueryTypes.SELECT,
    });

    if (!tablaLog.length) {
      return res.status(404).json({ error: "Tabla no encontrada" });
    }

    const tableName = tablaLog[0].nombre;
    let typeResult = 1;
    let infoBase = [];

    const filterValue = filter ? filter.trim() : "";

    if (filterValue === "") {
      const queryUltimos = `
        SELECT * 
        FROM ${tableName} 
        WHERE ESTADO = 'ACTIVO' 
        ORDER BY id DESC 
        LIMIT 10
      `;
      infoBase = await db.query(queryUltimos, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ result: infoBase, typeResult: 0 });
    }

    const queryIdentificador = `
      SELECT * 
      FROM ${tableName} 
      WHERE identificador = :filter 
      AND ESTADO = 'ACTIVO'
    `;
    infoBase = await db.query(queryIdentificador, {
      replacements: { filter: filterValue },
      type: QueryTypes.SELECT,
    });

    if (infoBase.length === 0) {
      typeResult = 2;
      const queryDocumento = `
        SELECT * 
        FROM ${tableName} 
        WHERE documento = :filter 
        AND ESTADO = 'ACTIVO'
      `;
      infoBase = await db.query(queryDocumento, {
        replacements: { filter: filterValue },
        type: QueryTypes.SELECT,
      });
    }

    if (infoBase.length === 0) {
      typeResult = 3;
      const queryNombre = `
        SELECT * 
        FROM ${tableName} 
        WHERE LOWER(NOMBRE) LIKE :filter 
        AND ESTADO = 'ACTIVO'
      `;
      infoBase = await db.query(queryNombre, {
        replacements: { filter: `%${filterValue.toLowerCase()}%` },
        type: QueryTypes.SELECT,
      });
    }

    res.status(200).json({ result: infoBase, typeResult });
  } catch (error) {
    res.status(500).json({
      error: "Error en getGestionByIdentificador",
      detalle: error.message,
    });
  }
};

const getHistorialRecords = async (req, res) => {
  try {
    const { idTabla, identificador } = req.params;

    if (!idTabla || !identificador) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    let queryString = `
        SELECT 
            gt.id,
            DATE_FORMAT(gt.fecha_tmk, '%Y-%m-%d %H:%i:%s') AS fecha_tmk,
            gt.IDENTIFICADOR,
            gt.id_table,
            gt.OBSERVACION,
            gt.NOMCONTACTO,
            gt.PISOS,
            gt.PUERTA,
            gt.FACHADA,
            DATE_FORMAT(gt.fecha_asignacion, '%Y-%m-%d %H:%i:%s') AS fecha_asignacion, 
            DATE_FORMAT(gt.fecha_analisis, '%Y-%m-%d %H:%i:%s') AS fecha_analisis,
            gt.estado,
            gt.id_registro,
            DATE_FORMAT(gt.fecha_promesa, '%Y-%m-%d %H:%i:%s') AS fecha_promesa,
            gt.monto_promesa,
            e.EFECTO,
            a.ACCION,
            a.tipo AS accion_tipo,
            c.CONTACTO,
            m.MOTIVO,
            t.NUMERO,
            CASE
              WHEN t.FUENTE='BUSQUEDA' THEN REPLACE(t.TIPO,'BUSQUEDA SEARCH','GESTIONES B')
              WHEN t.FUENTE='ENRIQUECIMIENTO' THEN REPLACE(t.TIPO,'ENRIQUECIMIENTO','GESTIONES E')
              WHEN t.FUENTE='BUSQUEDA AVAL' THEN REPLACE(t.TIPO,'BUSQUEDA SEARCH AVAL','GESTIONES BA')
              ELSE t.TIPO
				    END AS TIPO ,
            CONCAT(p.APELLIDOS, ' ', p.NOMBRES) AS personal,
            CONCAT(d.DEPARTAMENTO, '-', d.PROVINCIA, '-', d.DISTRITO, '-', d.DIRECCION) AS direccion,
            estGest.IDEAGESTION as id_estado_animo,
            estGest.NOMBRE_ESTADO_ANIMO as estado_animo,
            autTel.IDAUTORIZATEL as id_autorizacion_telefonica,
            autTel.NOMBRE_AUTORIZACION as auto_telefonica,
            cat.CATEGORIA AS HOMOLO
    `;

    // Si idTabla es 75, añadimos los campos de tienda
    if (idTabla == 75) {
      queryString += `,
            tienda.NombreTienda AS NombreTienda,
            tienda.DireccionTienda AS DireccionTienda
        `;
    }

    queryString += `
        FROM gestion_tmk gt
        LEFT JOIN efecto e ON gt.IDEFECTO = e.IDEFECTO
        LEFT JOIN accion a ON e.IDACCION = a.IDACCION
        LEFT JOIN contacto c ON gt.IDCONTACTO = c.IDCONTACTO
        LEFT JOIN motivo m ON gt.IDMOTIVO = m.IDMOTIVO
        INNER JOIN telefonos_actual t ON gt.IDTELEFONO = t.IDTELEFONO AND t.ESTADO IN (1,4)
        LEFT JOIN direcciones d ON gt.IDDIRECCION = d.IDDIRECCION
        LEFT JOIN personal p ON gt.IDPERSONAL = p.IDPERSONAL
        LEFT JOIN categoria cat ON e.IDCATEGORIA = cat.IDCATEGORIA
        LEFT JOIN ESTADO_GESTION estGest ON estGest.IDEAGESTION = gt.IDEAGESTION
        LEFT JOIN AUTORIZACION_TELEFONICA autTel ON autTel.IDAUTORIZATEL = gt.IDAUTORIZATEL
    `;

    // Si idTabla es 75, añadimos los JOIN adicionales correctamente antes del WHERE
    if (idTabla == 75) {
      queryString += `
            LEFT JOIN Gestion_Venta gv ON gt.id = gv.idGestion
            LEFT JOIN tienda ON gv.idTienda = tienda.idTienda
        `;
    }

    queryString += `
        WHERE gt.ID_CARTERA = :idTabla 
        AND gt.IDENTIFICADOR = :identificador
        AND gt.estado = 1
        AND p.TIPO_PERSONAL = 'HUMANO'
        ORDER BY gt.fecha_tmk DESC
    `;

    const historialRecords = await db.query(queryString, {
      replacements: { idTabla, identificador },
      type: QueryTypes.SELECT,
    });

    // Filtrar promesas
    const expectedPromises = historialRecords.filter(
      (record) =>
        record.fecha_promesa !== "0000-00-00" && record.monto_promesa > 0,
    );

    res
      .status(200)
      .json({ historial: historialRecords, promesas: expectedPromises });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getHistorialRecords", detalle: error.message });
  }
};

const getTelefonosContact = async (req, res) => {
  const timerLabel = "getTelefonosContact_query_time";

  try {
    const { documento, cartera } = req.params;

    if (!documento) {
      return res
        .status(400)
        .json({ error: "Número de documento no proporcionado" });
    }

    if (!cartera) {
      return res.status(400).json({ error: "Cartera no proporcionada" });
    }

    const queryString = `
      CALL sp_telefonos_por_dni_cartera_prueba_rendimiento(:documento, :cartera)
    `;

    const telefonos = await db.query(queryString, {
      replacements: {
        documento,
        cartera,
      },
      type: QueryTypes.RAW,
    });

    return res.status(200).json(telefonos);
  } catch (error) {
    return res.status(500).json({
      error: "Error en getTelefonosContact",
      detalle: error.message,
    });
  }
};

const getDireccionesAddress = async (req, res) => {
  const { documento } = req.params;

  if (!documento) {
    return res
      .status(400)
      .json({ error: "Número de documento no proporcionado" });
  }

  try {
    const queryString = `
    SELECT 
        IDDIRECCION,
        DOC,
        DATE_FORMAT(FECHAREG, '%Y-%m-%d %H:%i:%s') AS FECHAREG,
        FUENTE,
        DIRECCION_DEPURADA,
        REF_DEPURADA,
        ID_DEPARTAMENTO,
        ID_PROVINCIA,
        ID_DISTRITO,
        DIRECCION,
        REF,
        DEPARTAMENTO,
        PROVINCIA,
        DISTRITO,
        TIPO,
        IDPERSONAL,
        IDESTADO,
        ID_TIPO_DIRECCION,
        DATE_FORMAT(FECHA_ACTUALIZACION, '%Y-%m-%d %H:%i:%s') AS FECHA_ACTUALIZACION
    FROM direcciones 
    WHERE DOC = :docnumber
`;

    const addresses = await db.query(queryString, {
      replacements: { docnumber: documento },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(addresses);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getAddress", detalle: error.message });
  }
};

const getPagosIdentificadorCartera = async (req, res) => {
  const { identificador, idcartera } = req.params;

  if (!identificador || !idcartera) {
    return res.status(400).json({
      error: "Identificador o cartera no proporcionados",
    });
  }

  try {
    const result = `
      SELECT
        p.IDPAGO,
        p.PAGOS,
        DATE_FORMAT(FECHAREG, '%Y-%m-%d %H:%i:%s') AS FECHAREG,
        p.IDCARTERA,
        p.IDENTIFICADOR,
        p.TIPO,
        DATE_FORMAT(p.FECHAPAG, '%Y-%m-%d %H:%i:%s') AS FECHAPAG,
        p.MONTO,
        p.HOMOLO,
        p.IDESTADO,
        p.idcarga,
        p.Periodo,
        p.Usuario,
        c.id,
        c.cartera,
        c.tipo,
        c.tramo,
        c.central,
        c.idcliente,
        DATE_FORMAT(c.fecha_registro, '%Y-%m-%d %H:%i:%s') AS fecha_registro,
        DATE_FORMAT(c.fecha_baja, '%Y-%m-%d %H:%i:%s') AS fecha_baja,
        c.estado,
        c.idAnalistabd
      FROM pagos p JOIN cartera c ON p.IDCARTERA = c.id WHERE IDENTIFICADOR = :identificador AND IDCARTERA = :cartera`;

    const pagos = await db.query(result, {
      replacements: { identificador, cartera: idcartera },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({
      error: "Error en getPagosIdentificadorCartera",
      detalle: error.message,
    });
  }
};

const getCuotasIdentificador = async (req, res) => {
  const { identificador } = req.params;

  if (!identificador) {
    return res
      .status(400)
      .json({ error: "Identificador de la cuota no proporcionado" });
  }

  try {
    const queryString = `SELECT * FROM cuotas WHERE IDENTIFICADOR = :identificador`;

    const cuotas = await db.query(queryString, {
      replacements: { identificador },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(cuotas);
  } catch (error) {
    res.status(500).json({
      error: "Error en getCuotasIdentificador",
      detalle: error.message,
    });
  }
};

const getCuotasAutoplan = async (req, res) => {
  const { identificador } = req.params;

  if (!identificador) {
    return res
      .status(400)
      .json({ error: "Identificador de la cuota no proporcionado" });
  }

  try {
    const query = `
      SELECT 
        C.Cuenta,
        C.capital,
        C.comision,
        C.Penalidad,
        C.Seguro,
        C.Gps,
        C.Otros,
        C.Total,
        C.Saldo,
        DATE_FORMAT(C.Vencimiento, '%Y-%m-%d') AS Vencimiento
      FROM C_DETALLE_AUTOPLAN_NO_ADJUDICADO C
      WHERE C.Cuenta = :identificador
    `;

    const cuotas = await db.query(query, {
      replacements: { identificador },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(cuotas);
  } catch (error) {
    res.status(500).json({
      error: "Error en getCuotasAutoplan",
      detalle: error.message,
    });
  }
};

const getCampanasIdentificador = async (req, res) => {
  const { identificador, cartera } = req.params;

  if (!identificador) {
    return res.status(400).json({
      error: "Identificador no proporcionado",
    });
  }

  if (!cartera) {
    return res.status(400).json({
      error: "Cartera no proporcionada",
    });
  }

  try {
    const queryString = `
      SELECT
        tb1.ID,
        tb1.nombre,
        DATE_FORMAT(tb1.FECHAREG, '%Y-%m-%d %H:%i:%s') AS FECHAREG,
        tb1.IDCARTERA,
        tb2.cartera as CARTERA,
        tb1.IDENTIFICADOR,
        tb1.TIPO,
        DATE_FORMAT(tb1.FECHACAM, '%Y-%m-%d %H:%i:%s') AS FECHACAM,
        tb1.MONTO,
        tb1.PERCENT_DESC,
        tb1.HOMOLO,
        tb1.IDESTADO,
        tb1.idcarga
      FROM campanas tb1
      LEFT JOIN cartera tb2
        ON tb1.IDCARTERA = tb2.id
      WHERE IDENTIFICADOR = :identificador
      AND IDCARTERA = :cartera
      AND IDESTADO = 1
    `;

    const campanas = await db.query(queryString, {
      replacements: {
        identificador,
        cartera,
      },
      type: QueryTypes.SELECT,
    });

    return res.status(200).json(campanas);
  } catch (error) {
    return res.status(500).json({
      error: "Error en getCampanasIdentificador",
      detalle: error.message,
    });
  }
};

const getGestionProgramadaCarteraUsuario = async (req, res) => {
  const { idTabla, idUser } = req.params;

  if (!idTabla || !idUser) {
    return res.status(400).json({
      error: "Faltan parámetros requeridos",
    });
  }

  try {
    const query = `
      SELECT 
        g.IDENTIFICADOR,
        e.EFECTO,
        DATE_FORMAT(g.fecha_programacion, '%Y-%m-%d %H:%i:%s') AS fecha_programacion
      FROM gestion_tmk g
      LEFT JOIN efecto e ON g.IDEFECTO = e.IDEFECTO
      WHERE g.id_table = :idTabla
      AND g.IDPERSONAL = :idUser
      AND g.fecha_programacion > NOW()
    `;

    const gestiones = await db.query(query, {
      replacements: { idTabla, idUser },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(gestiones);
  } catch (error) {
    res.status(500).json({
      error: "Error en getGestionProgramadaCarteraUsuario",
      detalle: error.message,
    });
  }
};

const getTerceros = async (req, res) => {
  const { identificador } = req.params;

  if (!identificador) {
    return res.status(400).json({
      error: "Identificador o cartera no proporcionados",
    });
  }

  try {
    const queryString = `
      SELECT
        DOCUMENTO,
        TIPO,
        NOMBRE_COMPLETO
      FROM TERCEROS WHERE IDENTIFICADOR = :identificador AND ESTADO = 1`;

    const terceros = await db.query(queryString, {
      replacements: { identificador },
      type: QueryTypes.SELECT,
    });

    res.status(200).json(terceros);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getTerceros", detalle: error.message });
  }
};

const getEstadosAnimo = async (req, res) => {
  try {
    const query = `
      SELECT
        IDEAGESTION,
        NOMBRE_ESTADO_ANIMO,
        DESCRIPCION
      FROM ESTADO_GESTION
    `;

    const estados = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    res.status(200).json({
      ok: true,
      estados,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error en getEstadosAnimo", detalle: error.message });
  }
};

const getEstadosAutorizacion = async (req, res) => {
  try {
    const query = `
      SELECT
        IDAUTORIZATEL,
        NOMBRE_AUTORIZACION,
        DESCRIPCION
      FROM AUTORIZACION_TELEFONICA
    `;

    const respuestas = await db.query(query, {
      type: QueryTypes.SELECT,
    });

    res.status(200).json({
      ok: true,
      respuestas,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error en getEstadosAutorizacion",
      detalle: error.message,
    });
  }
};

const filterGestion = async (req, res) => {
  const {
    id_table,
    id_accion,
    id_efecto,
    id_motivo,
    fecha_gestion,
    fecha_asignacion,
    custom,
  } = req.body;

  if (!id_table) {
    return res.status(400).json({ error: "id_table es requerido" });
  }

  try {
    let query = `
      SELECT g.IDENTIFICADOR
      FROM gestion_tmk g
      LEFT JOIN efecto e ON g.IDEFECTO = e.IDEFECTO
      LEFT JOIN accion a ON e.IDACCION = a.IDACCION
      LEFT JOIN motivo m ON g.IDMOTIVO = m.IDMOTIVO
      WHERE g.id_table = :id_table
    `;

    let replacements = { id_table };

    // Aplicar filtros dinámicos
    if (id_accion && id_accion.length > 0) {
      query += ` AND e.IDACCION IN (:id_accion)`;
      replacements.id_accion = id_accion;
    }

    if (id_efecto && id_efecto.length > 0) {
      query += ` AND g.IDEFECTO IN (:id_efecto)`;
      replacements.id_efecto = id_efecto;
    }

    if (id_motivo && id_motivo.length > 0) {
      query += ` AND g.IDMOTIVO IN (:id_motivo)`;
      replacements.id_motivo = id_motivo;
    }

    // Filtrado por rango de fecha de gestión
    if (fecha_gestion) {
      let ini = `${fecha_gestion.value[0].substring(0, 10)} 00:00:00`;
      let fin = fecha_gestion.value[1]
        ? `${fecha_gestion.value[1].substring(0, 10)} 23:59:59`
        : `${fecha_gestion.value[0].substring(0, 10)} 23:59:59`;

      query += ` AND g.fecha_tmk BETWEEN :ini_fecha_gestion AND :fin_fecha_gestion`;
      replacements.ini_fecha_gestion = ini;
      replacements.fin_fecha_gestion = fin;
    }

    // Filtrado por rango de fecha de asignación
    if (fecha_asignacion) {
      let ini = `${fecha_asignacion.value[0].substring(0, 10)} 00:00:00`;
      let fin = fecha_asignacion.value[1]
        ? `${fecha_asignacion.value[1].substring(0, 10)} 23:59:59`
        : `${fecha_asignacion.value[0].substring(0, 10)} 23:59:59`;

      query += ` AND g.fecha_asignacion BETWEEN :ini_fecha_asignacion AND :fin_fecha_asignacion`;
      replacements.ini_fecha_asignacion = ini;
      replacements.fin_fecha_asignacion = fin;
    }

    // Ejecutar la primera consulta para obtener identificadores
    const resultIdentificadores = await db.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const idsIdentificadores = resultIdentificadores.map(
      (item) => item.IDENTIFICADOR,
    );

    if (idsIdentificadores.length > 0) {
      // Obtener el nombre de la tabla desde TablaLog
      const tablaLogQuery = `SELECT nombre FROM TablaLog WHERE id = :id_table`;
      const tablaLogResult = await db.query(tablaLogQuery, {
        replacements: { id_table },
        type: QueryTypes.SELECT,
      });

      if (tablaLogResult.length === 0) {
        return res
          .status(404)
          .json({ error: "No se encontró la tabla asociada" });
      }

      const tableName = tablaLogResult[0].nombre;

      // Construir la consulta final con identificadores
      let queryString = `SELECT * FROM ${tableName} WHERE identificador IN (:ids)`;
      let finalReplacements = { ids: idsIdentificadores };

      // Aplicar filtros adicionales personalizados
      if (custom && custom.length > 0) {
        let whereQuery = [];

        custom.forEach((column) => {
          if (column.optionSelect) {
            if (column.condition == 0) {
              whereQuery.push(
                `${column.optionSelect} LIKE '%${column.value}%'`,
              );
            } else {
              whereQuery.push(
                `${column.optionSelect} ${
                  Constants.array_condition[column.condition]
                } '${column.value}'`,
              );
            }
          }
        });

        queryString += ` AND ${whereQuery.join(" AND ")}`;
      }

      // Ejecutar la consulta final con identificadores y filtros
      const infoBase = await db.query(queryString, {
        replacements: finalReplacements,
        type: QueryTypes.SELECT,
      });

      res.status(200).json({
        result: infoBase,
        typeResult: 4,
      });
    } else {
      res.status(200).json({
        result: idsIdentificadores,
        typeResult: 4,
      });
    }
  } catch (error) {
    console.error("Error en filterGestion:", error);
    res.status(500).json({
      error: "Error en filterGestion",
      detalle: error.message,
    });
  }
};

const saveGestion = async (req, res) => {
  const {
    identificador,
    id_table,
    idefecto,
    idmotivo,
    idcontacto,
    observacion,
    id_user,
    nomcontacto,
    idcartera,
    idtelefono,
    iddireccion,
    pisos,
    puerta,
    fachada,
    hora_programacion,
    fecha_programacion,
    isPromise,
    monto_promesa,
    fecha_promesa,
    addAV,
    tienda_av,
    fecha_av,
    programar_visita_av,
    programar_cita_av,
    venta_av,
    desembolso_av,
    importe_av,
    observaciones_av,
    derivacion_canal_av,
    tipoCliente,
    autorizaCliente = 0,
  } = req.body;

  try {
    let fechaActual = moment().tz("America/Lima");

    let currentDay = fechaActual.format("dddd");

    let minTime, maxTime;

    if (currentDay === "Saturday") {
      minTime = fechaActual.clone().set({ hour: 7, minute: 55, second: 0 });
      maxTime = fechaActual.clone().set({ hour: 17, minute: 30, second: 0 });
    } else if (currentDay === "Sunday") {
      minTime = fechaActual.clone().set({ hour: 21, minute: 0, second: 0 });
      maxTime = fechaActual.clone().set({ hour: 21, minute: 1, second: 0 });
    } else {
      minTime = fechaActual.clone().set({ hour: 7, minute: 0, second: 0 });
      maxTime = fechaActual.clone().set({ hour: 19, minute: 55, second: 0 });
    }

    const fechaTmk = moment().tz("America/Lima").format("YYYY-MM-DD HH:mm:ss");

    const fechaActualizado = moment()
      .tz("America/Lima")
      .format("YYYY-MM-DD HH:mm:ss");

    const usuariosPermitidos = [1391, 17, 1390, 1235, 25, 647];

    const dentroHorario = fechaActual.isBetween(minTime, maxTime, null, "[]");
    const usuarioPermitido = usuariosPermitidos.includes(Number(id_user));

    if (dentroHorario || usuarioPermitido) {
      // ===== VALIDACIONES =====

      // 1. Efecto con motivos => debe seleccionar motivo
      const [motivos] = await db.query(
        `SELECT COUNT(*) AS total FROM motivo WHERE IDESTADO = 1 AND IDEFECTO = ?`,
        { replacements: [idefecto] },
      );

      if (motivos[0].total > 0 && !idmotivo) {
        return res.status(400).json({
          error:
            "Este efecto tiene motivos asociados. Debe seleccionar un motivo.",
        });
      }

      // 2. Efecto con contactos => debe seleccionar contacto
      const [contactos] = await db.query(
        `SELECT COUNT(*) AS total FROM contacto WHERE IDESTADO = 1 AND IDEFECTO = ?`,
        { replacements: [idefecto] },
      );

      if (contactos[0].total > 0 && !idcontacto) {
        return res.status(400).json({
          error:
            "Este efecto tiene contactos asociados. Debe seleccionar un contacto.",
        });
      }

      // 3. Promesa no puede ser negativa
      if (isPromise && monto_promesa < 0) {
        return res
          .status(400)
          .json({ error: "El monto de promesa no puede ser negativo." });
      }

      // 4. Validación cartera 75
      if (idcartera == 75 && [13539, 13519].includes(Number(idefecto))) {
        if (!fecha_av) {
          return res.status(400).json({
            error: "Debe ingresar una Fecha de Agendamiento para este efecto.",
          });
        }
      }

      // Tabla del join deoendiendo cartera (solo adjudicado y no adjudicado)
      let tablaAutoplan;

      if (idcartera == 48) {
        tablaAutoplan = "C_AUTOPLAN_VIGENTE";
      } else if (idcartera == 69) {
        tablaAutoplan = "C_AUTOPLAN_NO_ADJUDICADO";
      }

      // Convertir fecha_programacion al formato de la BD
      const fechaCompleta =
        fecha_programacion && hora_programacion
          ? moment(
              `${fecha_programacion} ${hora_programacion}`,
              "DD-MM-YYYY HH:mm",
            ).format("YYYY-MM-DD HH:mm:ss")
          : null;

      // 5. OBTENER TIPO DE CARTERA + FLAGS DEL EFECTO
      const [info] = await db.query(
        `
          SELECT
            C.tipo AS tipo_cartera,
            E.IDEFECTO,
            E.IDCATEGORIA,
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
          JOIN cartera C ON C.id = A.idcartera
          WHERE E.IDEFECTO = ?
        `,
        { replacements: [idefecto] },
      );

      const data = info[0];

      if (!data) {
        return res.status(400).json({ error: "Efecto inválido." });
      }

      const esCastigo = Number(data.tipo_cartera) === 3;

      let yaAutorizoEsteMes = false;
      let autorizacionFinal = autorizaCliente;

      if (esCastigo) {
        if (idtelefono) {
          const [autorizacionMes] = await db.query(
            `
              SELECT 1
              FROM gestion_tmk
              WHERE IDTELEFONO = ?
              AND IDAUTORIZATEL = 1
              AND DATE_FORMAT(fecha_tmk,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')
              LIMIT 1
            `,
            { replacements: [idtelefono] },
          );

          yaAutorizoEsteMes = autorizacionMes.length > 0;
        }

        if (yaAutorizoEsteMes) {
          autorizacionFinal = 1;
        }

        if (data.flag_contacto === 1) {
          if (!yaAutorizoEsteMes && autorizaCliente === 0) {
            return res.status(400).json({
              error: "Debe indicar si el cliente autoriza el uso del teléfono.",
            });
          }

          if (tipoCliente === null || tipoCliente === undefined) {
            return res.status(400).json({
              error: "Debe indicar el estado de ánimo del cliente.",
            });
          }
        }

        if (data.flag_reclamo === 1) {
          if (tipoCliente !== 1) {
            return res.status(400).json({
              error: "Para reclamos el estado de animo debe ser reclamo.",
            });
          }
        }
      }

      const query = `
        INSERT INTO gestion_tmk
          (
            IDENTIFICADOR,
            id_table,
            IDEFECTO,
            IDMOTIVO,
            IDCONTACTO,
            OBSERVACION,
            IDPERSONAL,
            NOMCONTACTO,
            ID_CARTERA,
            IDTELEFONO,
            IDDIRECCION,
            PISOS,
            PUERTA,
            FACHADA,
            fecha_programacion,
            fecha_tmk,
            FECHA_ACTUALIZADO,
            ESTADO_REVISION,
            estado,
            id_registro,
            monto_promesa,
            fecha_promesa,
            -- ================ REQUERIMIENTO DE PEDRO DE EMOCIONES DE LLAMADA (NO APROBADO POR GERENCIA) ================
            IDEAGESTION,
            IDAUTORIZATEL
          )
            VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            -- ================ REQUERIMIENTO DE PEDRO DE EMOCIONES DE LLAMADA (NO APROBADO POR GERENCIA) ================
            ?,
            ?
          )
        `;

      // Insertar en la base de datos
      const [gestion] = await db.query(query, {
        replacements: [
          identificador,
          id_table,
          idefecto,
          idmotivo || null,
          idcontacto || null,
          observacion || null,
          id_user,
          nomcontacto || null,
          idcartera,
          idtelefono || 0,
          iddireccion || 0,
          pisos || null,
          puerta || null,
          fachada || null,
          fechaCompleta,
          fechaTmk,
          fechaActualizado,
          0,
          "1",
          0,
          isPromise ? monto_promesa : null,
          isPromise && fecha_promesa ? fecha_promesa.substring(0, 10) : null,
          tipoCliente ?? null,
          autorizacionFinal ?? 0,
        ],
      });

      // ================= ACTUALIZAR AUTORIZACION TELEFONICA =================
      if (
        idtelefono &&
        data.flag_contacto === 1 &&
        !yaAutorizoEsteMes &&
        (autorizaCliente === 1 || autorizaCliente === 2)
      ) {
        let estadoAutorizacion = autorizacionFinal;

        await db.query(
          `
            UPDATE telefonos_actual
            SET IDAUTORIZATEL = ?
            WHERE idtelefono = ?
          `,
          {
            replacements: [estadoAutorizacion, idtelefono],
          },
        );
      }

      // Si ID_CARTERA es 75 y addAV es 1, insertar en gestion_venta
      if (idcartera == 75 && addAV == 1) {
        const fechaAgendamiento = fecha_av
          ? moment.parseZone(fecha_av).format("YYYY-MM-DD HH:mm:ss")
          : null;

        await db.query(
          `INSERT INTO Gestion_Venta (idGestion, idartera, idTienda, FechaAgendamiento, EstadoVisita, EstadoCita, EstadoVenta, EstadoDesembolso, Importe, Observacion, FechaRegistro, idPersonalRegistro, DerivacionCanal, EstadoGestion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              gestion,
              idcartera || null,
              tienda_av || null,
              fechaAgendamiento,
              programar_visita_av || null,
              programar_cita_av || null,
              venta_av || null,
              desembolso_av || null,
              importe_av || null,
              observaciones_av || null,
              fechaTmk || null,
              id_user || null,
              derivacion_canal_av || null,
              1,
            ],
          },
        );
      }

      // Si ID_CARTERA es 48 (ADJUDICADO) o 69 (NO ADJUDICADO), hacer la peticion a la api
      if (false) {
        // if (idcartera == 48 || idcartera == 69) {
        const sql = `SELECT
          CASE WHEN LENGTH(cav.documento) = 8 THEN 1 ELSE 2 END AS tipoasociado,
          cav.documento AS numerodocumento,
          0 AS gest_id,
          a.HOMOLO AS tipog_id,
          c.id_exter AS c_id,
          COALESCE(e.idhomo_ext, 0) AS result_id,
          t.numero AS gest_telefono,
          COALESCE(observacion, '') AS gest_comentario,
          COALESCE(fecha_promesa, '') AS fecha_compromiso,
          'cobranzas_peru' AS usuario_creacion
        FROM ${tablaAutoplan} cav
        INNER JOIN gestion_tmk gt ON cav.identificador = gt.IDENTIFICADOR
        INNER JOIN efecto e ON e.IDEFECTO = gt.IDEFECTO
        INNER JOIN accion a ON a.IDACCION = e.IDACCION
        INNER JOIN categoria c ON c.IDCATEGORIA = e.IDCATEGORIA
        INNER JOIN telefonos_actual t ON t.IDTELEFONO = gt.IDTELEFONO AND t.ESTADO IN (1, 4)
        WHERE cav.IDENTIFICADOR = ? AND fecha_tmk = ? AND e.DESCRIPCION LIKE '%AUTOPLAN%'`;

        const [resultado] = await db.query(sql, {
          replacements: [identificador, fechaTmk],
        });

        //
        //

        if (resultado.length > 0) {
          const row = resultado[0];
          const data = {
            tipoasociado: row.tipoasociado,
            numerodocumento: row.numerodocumento,
            gest_id: row.gest_id,
            tipog_id: row.tipog_id ? parseInt(row.tipog_id) || 0 : 0,
            c_id: row.c_id,
            result_id: row.result_id,
            gest_telefono: String(row.gest_telefono),
            gest_comentario: row.gest_comentario,
            fecha_compromiso: row.fecha_compromiso,
            usuario_creacion: row.usuario_creacion,
          };

          const response = await axios.post(
            process.env.AUTOMATION_API_ENDPOINT,
            data,
            {
              headers: {
                "x-api-key": process.env.AUTOMATION_API_KEY,
                "Content-Type": "application/json",
              },
              httpsAgent,
            },
          );
        } else {
          return res.status(404).json({ error: "Autoplan no encontrado" });
        }
      }

      return res.status(200).json({ success: true, gestion });
    } else {
      return res.status(400).json({ error: "Fuera de horario permitido" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateDireccion = async (req, res) => {
  try {
    const {
      document,
      origin,
      address,
      departament,
      province,
      district,
      ref,
      type,
      userId,
    } = req.body;

    if (!document || !address || !userId) {
      return res.status(400).json({ error: "Faltan parámetros obligatorios" });
    }

    // Obtener la fecha y hora actual en Lima
    const fechaRegistro = moment()
      .tz("America/Lima")
      .format("YYYY-MM-DD HH:mm:ss");

    const originBD = origin || "DESCONOCIDO";
    const typeBD = type || "GESTION";
    const departamentBD = departament || null;
    const provinceBD = province || null;
    const districtBD = district || null;
    const refBD = ref || null;

    // Insertar en la base de datos
    await db.query(
      `INSERT INTO direcciones (DOC, FUENTE, DIRECCION, DEPARTAMENTO, PROVINCIA, DISTRITO, REF, TIPO, IDPERSONAL, FECHAREG, IDESTADO)
           VALUES (:document, :originBD, :address, :departamentBD, :provinceBD, :districtBD, :refBD, :typeBD, :userId, :fechaRegistro, 1)`,
      {
        replacements: {
          document,
          originBD,
          address,
          departamentBD,
          provinceBD,
          districtBD,
          refBD,
          typeBD,
          userId,
          fechaRegistro,
        },
        type: QueryTypes.INSERT,
      },
    );

    const addresses = await db.query(
      `SELECT * FROM direcciones WHERE DOC = :document`,
      {
        replacements: { document },
        type: QueryTypes.SELECT,
      },
    );

    return res.status(200).json(addresses);
  } catch (error) {
    console.error("Error en updateDireccion:", error);
    return res
      .status(500)
      .json({ error: "Error en el servidor", detalle: error.message });
  }
};

const addTelefono = async (req, res) => {
  try {
    const { idcartera, document, number, userId } = req.body;
    const source = "GESTIONES";

    if (!idcartera || !document || !number) {
      return res.status(400).json({ message: "Faltan parámetros requeridos." });
    }

    const verification = await db.query(
      "CALL sp_verificar_telefonos_prueba(:idcartera, :document, :source, :number)",
      {
        replacements: { idcartera, document, source, number },
        type: QueryTypes.RAW,
      },
    );

    const resultado =
      verification?.[0]?.result ??
      verification?.[0]?.[0]?.result ??
      verification?.[0]?.[0]?.[0]?.result;

    if (resultado === 2) {
      return res
        .status(409)
        .json({ message: "El número se encuentra en lista negra." });
    }

    if (resultado === 1) {
      return res.status(409).json({ message: "El teléfono ya existe." });
    }

    const identificador = `${document}-${number}-${idcartera}-${source}`;
    const fechaReg = moment().tz("America/Lima").format("YYYY-MM-DD HH:mm:ss");

    await db.query(
      `INSERT INTO telefonos_actual
      (IDENTIFICADOR1, DOC, NUMERO, IDPERSONAL, IDTELEFONO, FECHAREG, ESTADO, SCORE_CLIENTE, TIPO, OPERADOR, FUENTE, ID_CARTERA)
      VALUES (:identificador, :document, :number, :userId, NULL, :fechaReg, 1, 1, :tipo, 6, :source, :idcartera)`,
      {
        replacements: {
          identificador,
          document,
          number,
          userId,
          fechaReg,
          tipo: "GESTIONES DIARIAS",
          source,
          idcartera,
        },
      },
    );

    const telefonos = await db.query(
      "CALL sp_telefonos_por_dni_cartera_prueba_rendimiento(:document, :idcartera)",
      {
        replacements: {
          document,
          idcartera,
        },
        type: QueryTypes.RAW,
      },
    );

    return res.status(200).json(telefonos);
  } catch (error) {
    console.error("Error al insertar teléfono:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
};

module.exports = {
  getGuiTable,
  getGestionByIdentificador,
  getHistorialRecords,
  getTelefonosContact,
  getDireccionesAddress,
  getPagosIdentificadorCartera,
  getCuotasIdentificador,
  getCuotasAutoplan,
  getCampanasIdentificador,
  getGestionProgramadaCarteraUsuario,
  getTerceros,
  filterGestion,
  saveGestion,
  updateDireccion,
  addTelefono,
  getEstadosAnimo,
  getEstadosAutorizacion,
};
