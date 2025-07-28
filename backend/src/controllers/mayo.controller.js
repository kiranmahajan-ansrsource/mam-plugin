const axios = require("axios");

let accessToken = null;
let tokenExpiresAt = 0;

const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

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
    const { access_token, expires_in } = response.data;

    accessToken = access_token;
    console.log(accessToken);
    
    tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;

    return accessToken;
  } catch (err) {
    console.error(
      "[getAccessToken] Failed to retrieve Mayo Clinic access token:",
      err.response?.data || err.message
    );
    accessToken = null;
    throw new Error("Could not authenticate with Mayo Clinic API.");
  }
};

const mayoController = async (req, res) => {
  try {
    const { query, pagenumber, countperpage } = req.query;
    const accessToken = await getAccessToken();
    const mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}asd` },
      params: {
        query: query,
        pagenumber: pagenumber,
        countperpage: countperpage,
        format: "json",
        fields:
          "Path_TR7,Path_TR1,Title,SystemIdentifier,IncludeInheritedKeywords,CreateDate",
      },
    });
    const items = mayoResponse?.data?.APIResponse?.Items || [];
    const total = mayoResponse?.data?.APIResponse?.GlobalInfo?.TotalCount || 0;
    res.json({ results: items, total });
  } catch (err) {
    console.error("[mayoController] Error:", err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
};

module.exports = {
  mayoController,
};
