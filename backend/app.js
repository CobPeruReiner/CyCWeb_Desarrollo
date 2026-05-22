// Librerias
const express = require("express");
const cors = require("cors");
const path = require("path");

// Rutas de la aplicacion
const { authRoutes } = require("./Routes/auth.routes");
const { gestionRoutes } = require("./Routes/gestion.routes");
const { accionRoutes } = require("./Routes/accion.routes");
const { categoriaRoutes } = require("./Routes/categoria.routes");
const { contactoRoutes } = require("./Routes/contacto.routes");
const { efectoRoutes } = require("./Routes/efecto.routes");
const { motivoRoutes } = require("./Routes/motivo.routes");
const { tiendaAvRoutes } = require("./Routes/tiendaAv.routes");
const { telefonosRoutes } = require("./Routes/telefonos.routes");
const { judicialRoutes } = require("./Routes/judicial.routes");

const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization, api_token",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

// Servimos los json dentro de la capeta assets
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Servimos el build de produccion
app.use(express.static(path.join(__dirname, "build")));

// Login
app.use("/", authRoutes);

// Gestion
app.use("/gestion", gestionRoutes);

// Accion
app.use("/accion", accionRoutes);

//Categoria
app.use("/categoria", categoriaRoutes);

// Efecto
app.use("/efecto", efectoRoutes);

// Motivo
app.use("/motivo", motivoRoutes);

// Contacto
app.use("/contacto", contactoRoutes);

// Tienda AV
app.use("/tiendaAV", tiendaAvRoutes);

// Telefonos
app.use("/telefono", telefonosRoutes);

// Judicial
app.use("/judicial", judicialRoutes);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"), (err) => {
    if (err) {
      console.error("Error al servir index.html:", err);
      res.status(404).send("Frontend no encontrado");
    }
  });
});

module.exports = { app };
