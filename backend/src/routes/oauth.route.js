const express = require("express");
const router = express.Router();

const {
  oauthLoginController,
  oauthCallbackController,
  oauthCheckController,
} = require("../controllers/oauth.controller");
const validateRequest = require("../middleware/validateRequest");
const {
  oauthLoginSchema,
  oauthCallbackSchema,
} = require("../validators/oauth.validator");

router.get(
  "/oauth/login",
  validateRequest(oauthLoginSchema, "query"),
  oauthLoginController
);

router.get(
  "/oauth/callback",
  // validateRequest(oauthCallbackSchema, "query"),
  oauthCallbackController
);

router.get("/oauth/check", oauthCheckController);

module.exports = router;
