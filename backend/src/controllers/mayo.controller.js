const axios = require("axios");

let accessToken = null;
let tokenExpires = 0;

const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpires) return accessToken;
  const response = await axios.post(
    process.env.MAYO_AUTH_URL,
    {
      client_id: process.env.MAYO_CLIENT_ID,
      client_secret: process.env.MAYO_CLIENT_SECRET,
    },
    { headers: { "Content-Type": "application/json" } }
  );
  accessToken = response.data.access_token;
  tokenExpires = Date.now() + (response.data.expires_in - 60) * 1000;
  return accessToken;
};

module.exports = { getAccessToken };
