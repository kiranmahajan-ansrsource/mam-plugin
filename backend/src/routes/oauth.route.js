const express = require("express");
const router = express.Router();

const {
  oauthLoginController,
  oauthCallbackController,
  oauthCheckController,
} = require("../controllers/oauth.controller");

router.get("/oauth/login", oauthLoginController);

router.get("/oauth/callback", oauthCallbackController);

router.get("/oauth/check", oauthCheckController);

module.exports = router;
