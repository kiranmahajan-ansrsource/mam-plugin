const axios = require("axios");
const {
  getUserId,
  getOrRenewToken,
  handleError,
} = require("../utils/common.utils");

async function getNewMayoToken() {
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
  return { access_token, expires_in };
}

const mayoController = async (req, res) => {
  try {
    const { query, pagenumber, countperpage } = req.query;
    const userId = getUserId(req, res);

    const accessToken = await getOrRenewToken({
      userId,
      provider: "mayo",
      getNewTokenFn: getNewMayoToken,
    });

    if (!accessToken) {
      return handleError(res, 401, "Failed to obtain Mayo access token");
    }

    const mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        query: query,
        pagenumber: pagenumber,
        countperpage: countperpage,
        format: "json",
        fields:
          "SystemIdentifier,Title,Path_TR7,Path_TR1,CreateDate,EditDate,MediaType,DocSubType,mimetype,MediaNumber,Caption,Directory,UsageDescription,Keyword",
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
