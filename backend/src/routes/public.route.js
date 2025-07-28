const express = require("express");
const router = express.Router();

const {
  publicInsertController,
  publicRolesController,
  searchImagesController,
} = require("../controllers/public.controller");

router.post("/insert", publicInsertController);
router.get("/roles", publicRolesController);
router.get("/api/search-images", searchImagesController);

module.exports = router;
