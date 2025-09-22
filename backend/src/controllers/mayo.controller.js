const axios = require("axios");
const asyncHandler = require("express-async-handler");
const { getUserId, getOrRenewToken, HttpError } = require("../utils");

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

  const { access_token, expires_in } = response.data || {};
  if (!access_token) {
    throw new HttpError(502, "Authentication token could not be obtained.");
  }

  return { access_token, expires_in };
}

const mayoController = asyncHandler(async (req, res) => {
  const { query, pagenumber, countperpage } = req.query;
  const userId = getUserId(req, res);

  const disallowedPattern = /[:%&#]/;
  if (!query || !String(query).trim()) {
    throw new HttpError(400, "Search query is required.");
  }
  if (disallowedPattern.test(String(query))) {
    throw new HttpError(
      400,
      "Please remove invalid characters (: % & #) to continue."
    );
  }

  const accessToken = await getOrRenewToken({
    userId,
    provider: "mayo",
    getNewTokenFn: getNewMayoToken,
  });

  if (!accessToken) {
    throw new HttpError(401, "Authentication token could not be obtained.");
  }

  let mayoResponse;
  try {
    mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        query,
        pagenumber,
        countperpage,
        format: "json",
        fields:
          "SystemIdentifier,Title,Path_TR7,Path_TR1,CreateDate,EditDate,MediaType,DocSubType,mimetype,MediaNumber,Caption,Directory,UsageDescription,Keyword,MAY.Digital-Rights-Situation,MAY.Copyright-Holder,MAY.Copyright-Type",
      },
      timeout: 15000,
    });
  } catch (err) {
    const status = err?.response?.status;
    const upstreamMsg = err?.response?.data?.message || err?.message || "";
    if (!status || status >= 500) {
      throw new HttpError(
        500,
        "The service is temporarily unavailable. Please try again later."
      );
    }

    if (status === 401 || status === 403) {
      throw new HttpError(502, "Authentication with the mayo service failed.");
    }
    if (status === 400) {
      throw new HttpError(400, upstreamMsg || "Invalid search request.");
    }
    throw new HttpError(502, "Failed to retrieve search results.");
  }

  const items = mayoResponse?.data?.APIResponse?.Items || [];
  const total = mayoResponse?.data?.APIResponse?.GlobalInfo?.TotalCount || 0;

  res.json({ results: items, total });
});

module.exports = {
  mayoController,
};
