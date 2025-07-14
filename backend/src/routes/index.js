const express = require("express");
const router = express.Router();

const oauthRoutes = require("./oauth.route");
const mayoRoutes = require("./mayo.route");
const publicRoutes = require("./public.route");
const catchRoutes = require("./catch.route");

router.use(oauthRoutes);
router.use(mayoRoutes);
router.use(publicRoutes);
router.use(catchRoutes);
module.exports = router;
