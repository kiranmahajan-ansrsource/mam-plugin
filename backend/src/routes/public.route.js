const express = require("express");
const router = express.Router();

const { publicInsertController } = require("../controllers/public.controller");

router.post("/insert", publicInsertController);

module.exports = router;
