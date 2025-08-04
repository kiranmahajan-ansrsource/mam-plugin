const axios = require("axios");
const Token = require("../model/token.model");

function setSignedCookie(res, name, value, options = {}) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: "None",
    ...options,
  });
}

function clearSignedCookie(res, name, options = {}) {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: "None",
    ...options,
  });
}

function handleError(res, status, message) {
  return res.status(status).send(message);
}

function buildOAuthAuthUrl(state) {
  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.D2L_OAUTH_CLIENT_ID,
    redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
    scope: "content:modules:* content:topics:* core:*:*",
    state,
  });
  return `${process.env.D2L_OAUTH_URL}?${queryParams}`;
}

async function fetchImageBuffer(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = response.headers["content-type"];
  if (!contentType || !contentType.startsWith("image/")) {
    throw new Error(
      `Invalid content type for image URL: ${contentType || "Not provided"}`
    );
  }
  console.log(`Image Service: Fetched image with content type: ${contentType}`);
  return { buffer: response.data, contentType };
}

const rolesString = process.env.ALLOWED_ROLES || "";

const ALLOWED_ROLES = rolesString
  .split(",")
  .map((role) => role.trim())
  .filter((role) => role);

function hasAllowedRole(userRoles) {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  return userRoles.some((role) => ALLOWED_ROLES.includes(role));
}

function unflatten(flatObj) {
  const result = {};
  for (const flatKey in flatObj) {
    if (!Object.prototype.hasOwnProperty.call(flatObj, flatKey)) continue;

    const value = flatObj[flatKey];
    const keys = flatKey.split(".");
    let curr = result;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        curr[key] = value;
      } else {
        if (!(key in curr)) {
          curr[key] = {};
        }
        curr = curr[key];
      }
    }
  }
  return result;
}

async function getOrUpdateToken({ userId, provider, getNewTokenFn }) {
  if (!userId) return null;
  const tokenDoc = await Token.findOne({
    userId,
    provider,
    expires_at: { $gt: new Date() },
  });
  if (tokenDoc && tokenDoc.access_token) return tokenDoc.access_token;

  const { access_token, expires_in, refresh_token } = await getNewTokenFn();
  if (!access_token || !userId) return null;
  const expires_at = new Date(Date.now() + (expires_in - 60) * 1000);
  await Token.findOneAndUpdate(
    { userId, provider },
    { access_token, refresh_token, expires_at },
    { upsert: true, new: true }
  );
  return access_token;
}

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

function getUserId(req, res) {
  if (res.locals?.context?.user) return res.locals.context.user;
  if (req.signedCookies && req.signedCookies.ltiUserId)
    return req.signedCookies.ltiUserId;
  return null;
}

async function getValidD2LAccessToken(userId) {
  const provider = "d2l";
  let tokenDoc = userId
    ? await Token.findOne({ userId, provider, expires_at: { $gt: new Date() } })
    : null;
  if (tokenDoc && tokenDoc.access_token) return tokenDoc.access_token;

  let refreshToken = null;
  if (!tokenDoc && userId) {
    const expiredDoc = await Token.findOne({ userId, provider });
    if (expiredDoc && expiredDoc.refresh_token)
      refreshToken = expiredDoc.refresh_token;
  } else if (tokenDoc && tokenDoc.refresh_token) {
    refreshToken = tokenDoc.refresh_token;
  }
  if (refreshToken) {
    try {
      const tokenData = await getRefreshedD2LToken(refreshToken);
      const { access_token, refresh_token, expires_in } = tokenData;
      const expires_at = new Date(Date.now() + (expires_in - 60) * 1000);
      await Token.findOneAndUpdate(
        { userId, provider },
        { access_token, refresh_token, expires_at },
        { upsert: true, new: true }
      );
      return access_token;
    } catch (err) {
      await Token.deleteOne({ userId, provider });
      return null;
    }
  }
  return null;
}

module.exports = {
  setSignedCookie,
  clearSignedCookie,
  handleError,
  buildOAuthAuthUrl,
  fetchImageBuffer,
  hasAllowedRole,
  unflatten,
  getOrUpdateToken,
  getUserId,
  getValidD2LAccessToken,
  getNewD2LToken,
  getRefreshedD2LToken,
};
