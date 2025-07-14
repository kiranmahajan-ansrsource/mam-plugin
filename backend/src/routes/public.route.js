const express = require("express");
const router = express.Router();

const {
  publicDetailsController,
  publicInsertController,
} = require("../controllers/public.controller");

router.post("/details", publicDetailsController);

router.post("/insert", publicInsertController);

module.exports = router;
