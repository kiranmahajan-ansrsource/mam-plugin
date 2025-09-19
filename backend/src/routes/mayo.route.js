const express = require("express");
const router = express.Router();

const { mayoController } = require("../controllers/mayo.controller");
const validateRequest = require("../middleware/validateRequest");
const { mayoSearchSchema } = require("../validators/mayo.validator");

router.get(
  "/api/images",
  validateRequest(mayoSearchSchema, "query"),
  mayoController
);

module.exports = router;
