const { Router } = require("express");
const excelRoutes = require("./excelRoutes");

const router = Router();

router.use("/excel", excelRoutes);

module.exports = router;
