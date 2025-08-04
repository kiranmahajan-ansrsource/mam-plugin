const crypto = require("crypto");
const axios = require("axios");
const lti = require("ltijs").Provider;
const {
  setSignedCookie,
  clearSignedCookie,
  handleError,
  buildOAuthAuthUrl,
  getNewD2LToken,
  getUserId,
  getValidD2LAccessToken,
} = require("../utils/common.utils");
const Token = require("../model/token.model");

const oauthLoginController = (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const returnToUrl = req.query.returnTo || "/deeplink";
    if (!req.query.returnTo) {
      console.log(
        `No specific returnTo URL provided, defaulting to: ${returnToUrl}`
      );
    }
    setSignedCookie(
      res,
      "oauthState",
      { state, returnTo: returnToUrl },
      { maxAge: 36000 }
    );
    const authUrl = buildOAuthAuthUrl(state);
    return lti.redirect(res, authUrl);
  } catch (error) {
    console.error("[/oauth/login] Uncaught error:", error.message || error);
    return handleError(
      res,
      500,
      "An unexpected error occurred during OAuth login initiation."
    );
  }
};

const oauthCallbackController = async (req, res) => {
  const { code, state } = req.query;
  let storedStateData;
  let returnToUrl = "/deeplink";
  try {
    storedStateData = req.signedCookies.oauthState;
    if (!storedStateData) {
      console.error(
        "[OAuth Callback] ERROR: Signed OAuth state cookie not found or tampered. Possible CSRF or expired cookie."
      );
      return handleError(
        res,
        403,
        "Authentication failed: Invalid or missing state. Please try logging in again."
      );
    }
    const { state: storedState, returnTo: storedReturnTo } = storedStateData;
    returnToUrl = storedReturnTo || returnToUrl;
    if (!state || state !== storedState) {
      console.error(
        "[OAuth Callback] ERROR: Invalid or missing state parameter from D2L callback. Possible CSRF attack."
      );
      return handleError(
        res,
        403,
        "Invalid OAuth state. Please try logging in again."
      );
    }
    clearSignedCookie(res, "oauthState");
    if (!code) {
      console.error("[OAuth Callback] ERROR: Missing code parameter from D2L.");
      return handleError(res, 400, "Missing code param");
    }
    // Exchange code for token
    const tokenData = await getNewD2LToken(code);
    const { access_token, refresh_token, expires_in } = tokenData;
    console.log("Access Token obtained successfully.");

    // Save to MongoDB using getUserId
    const userId = getUserId(req, res);
    console.log(userId, "userID");
    const expires_at = new Date(Date.now() + (expires_in - 60) * 1000);
    await Token.findOneAndUpdate(
      { userId, provider: "d2l" },
      { access_token, refresh_token, expires_at },
      { upsert: true, new: true }
    );

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
    return handleError(
      res,
      500,
      "OAuth token exchange failed or an unexpected error occurred."
    );
  }
};

const oauthCheckController = async (req, res) => {
  const userId = getUserId(req, res);
  const d2lAccessToken = await getValidD2LAccessToken(userId);
  if (d2lAccessToken) {
    return res.json({ authenticated: true });
  } else {
    return res.json({ authenticated: false, expired: true });
  }
};

module.exports = {
  oauthLoginController,
  oauthCallbackController,
  oauthCheckController,
};
