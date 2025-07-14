const axios = require("axios");

let accessToken = null;
let tokenExpires = 0;

const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpires) return accessToken;

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

const mayoController = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        query: req.query.q,
        pagenumber: req.query.page,
        countperpage: req.query.limit,
        format: "json",
        fields:
          "Path_TR7,Path_TR1,Title,SystemIdentifier,IncludeInheritedKeywords,CreateDate",
      },
    });
    const items = mayoResponse?.data?.APIResponse?.Items || [];
    const total = mayoResponse?.data?.APIResponse?.GlobalInfo?.TotalCount || 0;
    res.json({ results: items, total });
  } catch (err) {
    console.error("[/api/images] ERROR:", err?.message || err);
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message });
  }
};

module.exports = {
  mayoController,
};
