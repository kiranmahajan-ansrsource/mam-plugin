const axios = require("axios");

let accessToken = null;
let tokenExpires = 0;

const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpires) return accessToken;

  if (
    !process.env.MAYO_AUTH_URL ||
    !process.env.MAYO_CLIENT_ID ||
    !process.env.MAYO_CLIENT_SECRET
  ) {
    console.error("[getAccessToken] Missing Mayo API env vars");
    throw new Error("Missing Mayo API env vars");
  }

  try {
    const response = await axios.post(
      process.env.MAYO_AUTH_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.MAYO_CLIENT_ID,
        client_secret: process.env.MAYO_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    accessToken = response.data.access_token;
    tokenExpires = Date.now() + (response.data.expires_in - 60) * 1000;
    return accessToken;
  } catch (err) {
    console.error(
      "[getAccessToken] ERROR:",
      err && err.stack ? err.stack : err
    );
    if (err.response) {
      console.error(
        "[getAccessToken] Mayo Auth error response:",
        err.response.data
      );
    }
    throw err;
  }
};

module.exports = { getAccessToken };
