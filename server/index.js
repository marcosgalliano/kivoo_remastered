const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { google } = require("googleapis");
const routes = require("./routes/index");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// RUTAS
app.use("/api", routes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
