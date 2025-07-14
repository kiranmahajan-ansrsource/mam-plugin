const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const lti = require("ltijs").Provider;

router.get("/oauth/login", (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");

    let returnToUrl = "/deeplink";
    if (req.query.returnTo) {
      returnToUrl = req.query.returnTo;
    } else {
      console.log(
        `No specific returnTo URL provided, defaulting to: ${returnToUrl}`
      );
    }

    res.cookie(
      "oauthState",
      { state, returnTo: returnToUrl },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: true,
        sameSite: "None",
        maxAge: 300000,
      }
    );
    console.log("OAuth state and returnTo URL stored in signed cookie.");

    if (
      !process.env.D2L_OAUTH_CLIENT_ID ||
      !process.env.D2L_OAUTH_REDIRECT_URI ||
      !process.env.D2L_OAUTH_URL
    ) {
      console.error(
        "Missing D2L OAuth environment variables. Please check .env file."
      );
      return res
        .status(500)
        .send(
          "Server configuration error: D2L OAuth environment variables are not set."
        );
    }

    const queryParams = new URLSearchParams({
      response_type: "code",
      client_id: process.env.D2L_OAUTH_CLIENT_ID,
      redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
      scope: "content:modules:* content:topics:* core:*:*",
      state: state,
    });

    const authUrl = `${process.env.D2L_OAUTH_URL}?${queryParams}`;
    console.log(`Redirecting to D2L OAuth URL: ${authUrl}`);
    return lti.redirect(res, authUrl);
  } catch (error) {
    console.error("[/oauth/login] Uncaught error:", error.message || error);
    return res
      .status(500)
      .send("An unexpected error occurred during OAuth login initiation.");
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
      return res
        .status(403)
        .send(
          "Authentication failed: Invalid or missing state. Please try logging in again."
        );
    }

    const { state: storedState, returnTo: storedReturnTo } = storedStateData;
    returnToUrl = storedReturnTo || returnToUrl;

    if (!state || state !== storedState) {
      console.error(
        "[OAuth Callback] ERROR: Invalid or missing state parameter from D2L callback. Possible CSRF attack."
      );
      return res
        .status(403)
        .send("Invalid OAuth state. Please try logging in again.");
    }
    res.clearCookie("oauthState", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      sameSite: "None",
    });
    console.log("OAuth state validated and cookie cleared successfully.");

    if (!code) {
      console.error("[OAuth Callback] ERROR: Missing code parameter from D2L.");
      return res.status(400).send("Missing code param");
    }

    if (
      !process.env.D2L_OAUTH_TOKEN_URL ||
      !process.env.D2L_OAUTH_REDIRECT_URI ||
      !process.env.D2L_OAUTH_CLIENT_ID ||
      !process.env.D2L_OAUTH_CLIENT_SECRET
    ) {
      console.error(
        "Missing D2L OAuth token exchange environment variables. Please check .env file."
      );
      return res
        .status(500)
        .send(
          "Server configuration error: D2L OAuth token exchange variables are not set."
        );
    }

    const payload = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
      client_id: process.env.D2L_OAUTH_CLIENT_ID,
      client_secret: process.env.D2L_OAUTH_CLIENT_SECRET,
    });

    console.log("Attempting to exchange OAuth code for token...");
    const tokenRes = await axios.post(
      process.env.D2L_OAUTH_TOKEN_URL,
      payload.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenRes.data;

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

    return res
      .status(500)
      .send("OAuth token exchange failed or an unexpected error occurred.");
  }
});

router.get("/api/d2l-auth-status", (req, res) => {
  const d2lAccessToken = req.cookies.d2lAccessToken;
  if (d2lAccessToken) {
    return res.json({ authenticated: true });
  } else {
    return res.json({ authenticated: false });
  }
});

module.exports = router;
