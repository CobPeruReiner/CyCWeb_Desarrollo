const express = require("express");
const {
  iniciarLlamada,
  noGestion,
  marcarGestion,
} = require("../Controllers/controlLlamada.controller");

const controlLlamadaRoutes = express.Router();

controlLlamadaRoutes.post("/inicio", iniciarLlamada);

controlLlamadaRoutes.post("/gestion", marcarGestion);

controlLlamadaRoutes.post("/no-gestion", noGestion);

module.exports = { controlLlamadaRoutes };
