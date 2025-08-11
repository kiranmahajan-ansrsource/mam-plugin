const crypto = require("crypto");
const axios = require("axios");
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
  console.log("[D2L OAuth] Requesting new access token using code exchange...");
  const tokenRes = await axios.post(
    process.env.D2L_OAUTH_TOKEN_URL,
    payload.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  console.log("[D2L OAuth] New access token obtained.");
  return tokenRes.data;
}

async function getRefreshedD2LToken(refreshToken) {
  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.D2L_OAUTH_CLIENT_ID,
    client_secret: process.env.D2L_OAUTH_CLIENT_SECRET,
  });
  console.log("[D2L OAuth] Refreshing access token using refresh_token...");
  const tokenRes = await axios.post(
    process.env.D2L_OAUTH_TOKEN_URL,
    payload.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  console.log("[D2L OAuth] Access token refreshed.");
  return tokenRes.data;
}

const oauthLoginController = (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const returnToUrl = req.query.returnTo || "/insert";

    if (!req.query.returnTo) {
      console.log(
        `No specific returnTo URL provided, defaulting to: ${returnToUrl}`
      );
    }

    setSignedCookie(
      res,
      "oauthState",
      { state, returnTo: returnToUrl },
      { maxAge: 10 * 60 * 1000 }
    );

    const authUrl = buildOAuthUrl(state);
    return lti.redirect(res, authUrl);
  } catch (error) {
    console.error("[/oauth/login] Uncaught error:", error.message || error);
    return httpError(
      500,
      "An unexpected error occurred during OAuth login initiation."
    );
  }
};

const oauthCallbackController = async (req, res) => {
  const { code, state } = req.query;
  let storedStateData;
  let returnToUrl = "/insert";

  try {
    storedStateData = req.signedCookies?.oauthState;
    if (!storedStateData) {
      console.error(
        "[OAuth Callback] ERROR: Signed OAuth state cookie not found or tampered."
      );
      return httpError(
        403,
        "Authentication failed: Invalid or missing state. Please try logging in again."
      );
    }

    const { state: storedState, returnTo: storedReturnTo } = storedStateData;
    returnToUrl = storedReturnTo || returnToUrl;

    if (!state || state !== storedState) {
      console.error(
        "[OAuth Callback] ERROR: Invalid or missing state parameter from D2L callback."
      );
      return httpError(
        403,
        "Invalid OAuth state. Please try logging in again."
      );
    }

    clearSignedCookie(res, "oauthState");

    if (!code) {
      console.error("[OAuth Callback] ERROR: Missing code parameter from D2L.");
      return httpError(400, "Missing code param");
    }

    const tokenData = await getNewD2LToken(code);
    console.log("Access Token obtained successfully.");

    const userId = getUserId(req, res);
    await saveTokenToDb(userId, "d2l", tokenData);

    return res.redirect(returnToUrl);
  } catch (err) {
    console.error(
      "[OAuth Callback] ERROR during token exchange or processing:",
      err?.response?.data || err.message || err
    );

    if (axios.isAxiosError(err)) {
      console.error("Axios Error Code:", err.code);
      console.error("Axios Error Message:", err.message);
      console.error("Axios Request URL:", err.config?.url);
      if (err.response) {
        console.error("Axios Error Response Status:", err.response.status);
        console.error("Axios Error Response Data:", err.response.data);
      }
    }

    return httpError(
      500,
      "OAuth token exchange failed or an unexpected error occurred."
    );
  }
};

const oauthCheckController = async (req, res) => {
  const userId = getUserId(req, res);

  const d2lAccessToken = await getOrRenewToken({
    userId,
    provider: "d2l",
    getNewTokenFn: async () => null,
    getRefreshTokenFn: getRefreshedD2LToken,
  });

  if (d2lAccessToken) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
};

module.exports = {
  oauthLoginController,
  oauthCallbackController,
  oauthCheckController,
  getRefreshedD2LToken,
};
