const { Router } = require("express");
const { updateStatusInExcelHandler, consultarEnviosHandler } = require("../handlers/excelHandler");

const excelRoutes = Router();

excelRoutes.post("/update-status", updateStatusInExcelHandler);
excelRoutes.post("/consultar-envios", consultarEnviosHandler);

module.exports = excelRoutes;
