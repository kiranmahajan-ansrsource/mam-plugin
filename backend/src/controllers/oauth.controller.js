const crypto = require("crypto");
const axios = require("axios");
const asyncHandler = require("express-async-handler");
const lti = require("ltijs").Provider;
const {
  setSignedCookie,
  clearSignedCookie,
  httpError,
  buildOAuthUrl,
  getOrRenewToken,
  saveTokenToDb,
  getUserId,
} = require("../utils");

async function getNewD2LToken(code) {
  const payload = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
    client_id: process.env.D2L_OAUTH_CLIENT_ID,
    client_secret: process.env.D2L_OAUTH_CLIENT_SECRET,
  });
  if (process.env.LOG_VERBOSE === "1") {
    console.log("[D2L OAuth] Requesting new access token...");
  }
  const tokenRes = await axios.post(
    process.env.D2L_OAUTH_TOKEN_URL,
    payload.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (process.env.LOG_VERBOSE === "1") {
    console.log("[D2L OAuth] New access token obtained.");
  }
  return tokenRes.data;
}

async function getRefreshedD2LToken(refreshToken) {
  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.D2L_OAUTH_CLIENT_ID,
    client_secret: process.env.D2L_OAUTH_CLIENT_SECRET,
  });
  if (process.env.LOG_VERBOSE === "1") {
    console.log("[D2L OAuth] Refreshing access token...");
  }
  const tokenRes = await axios.post(
    process.env.D2L_OAUTH_TOKEN_URL,
    payload.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (process.env.LOG_VERBOSE === "1") {
    console.log("[D2L OAuth] Access token refreshed.");
  }
  return tokenRes.data;
}

const oauthLoginController = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const returnToUrl = req.query.returnTo || "/insert";

  setSignedCookie(
    res,
    "oauthState",
    { state, returnTo: returnToUrl },
    { maxAge: 10 * 60 * 1000 }
  );

  const authUrl = buildOAuthUrl(state);
  return lti.redirect(res, authUrl);
});

const oauthCallbackController = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  const storedStateData = req.signedCookies?.oauthState;
  let returnToUrl = "/insert";

  if (!storedStateData) {
    throw httpError(
      403,
      "Authentication failed: Invalid or missing state. Please try logging in again."
    );
  }

  const { state: storedState, returnTo: storedReturnTo } = storedStateData;
  returnToUrl = storedReturnTo || returnToUrl;

  if (!state || state !== storedState) {
    throw httpError(403, "Invalid OAuth state. Please try logging in again.");
  }

  clearSignedCookie(res, "oauthState");

  if (!code) {
    throw httpError(400, "Missing 'code' parameter from D2L.");
  }

  const tokenData = await getNewD2LToken(code);
  const userId = getUserId(req, res);
  await saveTokenToDb(userId, "d2l", tokenData);

  return res.redirect(returnToUrl);
});

const oauthCheckController = asyncHandler(async (req, res) => {
  const userId = getUserId(req, res);

  const d2lAccessToken = await getOrRenewToken({
    userId,
    provider: "d2l",
    getNewTokenFn: async () => null,
    getRefreshTokenFn: getRefreshedD2LToken,
  });

  res.json({ authenticated: !!d2lAccessToken });
});

module.exports = {
  oauthLoginController,
  oauthCallbackController,
  oauthCheckController,
  getRefreshedD2LToken,
};
