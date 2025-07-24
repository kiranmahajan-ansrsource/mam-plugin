const express = require("express");
const router = express.Router();

const {
  publicInsertController,
  publicRolesController,
} = require("../controllers/public.controller");

router.post("/insert", publicInsertController);
router.get("/roles", publicRolesController);

module.exports = router;
