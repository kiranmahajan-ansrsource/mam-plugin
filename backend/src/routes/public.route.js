const express = require("express");
const router = express.Router();

const {
  publicInsertController,
  publicRolesController,
  publicSearchDBController,
} = require("../controllers/public.controller");
const validateRequest = require("../middleware/validateRequest");
const {
  insertValidator,
  searchDbValidator,
} = require("../validators/public.validator");

router.post(
  "/insert",
  // validateRequest(insertValidator),
  publicInsertController
);
router.get("/roles", publicRolesController);
router.get(
  "/search-db",
  validateRequest(searchDbValidator, "query"),
  publicSearchDBController
);

module.exports = router;
