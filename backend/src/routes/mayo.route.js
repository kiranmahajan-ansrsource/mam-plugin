const express = require("express");
const router = express.Router();

const { mayoController } = require("../controllers/mayo.controller");

router.get("/api/images", mayoController);

module.exports = router;
