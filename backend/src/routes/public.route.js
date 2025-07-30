const express = require("express");
const router = express.Router();

const {
  publicInsertController,
  publicRolesController,
  publicSearchDBController,
} = require("../controllers/public.controller");

router.post("/insert", publicInsertController);
router.get("/roles", publicRolesController);
router.get("/search-db", publicSearchDBController);

module.exports = router;
