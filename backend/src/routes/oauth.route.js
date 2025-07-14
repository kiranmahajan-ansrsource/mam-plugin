const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const lti = require("ltijs").Provider;

const {
  setSignedCookie,
  clearSignedCookie,
  handleError,
  buildOAuthAuthUrl,
  buildOAuthTokenPayload,
} = require("../utils/common.utils");

router.get("/oauth/login", (req, res) => {
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
    console.log("OAuth state and returnTo URL stored in signed cookie.");
    const authUrl = buildOAuthAuthUrl(state);

    console.log(`Redirecting to D2L OAuth URL: ${authUrl}`);
    return lti.redirect(res, authUrl);
  } catch (error) {
    console.error("[/oauth/login] Uncaught error:", error.message || error);
    return handleError(
      res,
      500,
      "An unexpected error occurred during OAuth login initiation."
    );
  }
});

router.get("/oauth/callback", async (req, res) => {
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
    console.log("OAuth state validated and cookie cleared successfully.");
    if (!code) {
      console.error("[OAuth Callback] ERROR: Missing code parameter from D2L.");
      return handleError(res, 400, "Missing code param");
    }

    const payload = buildOAuthTokenPayload(code);
    console.log("Attempting to exchange OAuth code for token...");
    const tokenRes = await axios.post(
      process.env.D2L_OAUTH_TOKEN_URL,
      payload.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const { access_token } = tokenRes.data;
    console.log("Access Token obtained successfully.✅✅✅", access_token);
    res.cookie("d2lAccessToken", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 3600000,
    });
    console.log(`Redirecting to original URL: ${returnToUrl}`);
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
});

router.get("/oauth/check", (req, res) => {
  const d2lAccessToken = req.cookies.d2lAccessToken;
  return res.json({ authenticated: !!d2lAccessToken });
});

module.exports = router;
