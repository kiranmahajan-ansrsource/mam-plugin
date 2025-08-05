const axios = require("axios");
const Token = require("../model/token.model");

function setSignedCookie(res, name, value, options = {}) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    ...options,
  });
}

function clearSignedCookie(res, name, options = {}) {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
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

function getUserId(req, res) {
  if (res.locals?.context?.user) return res.locals.context.user;
  if (req.signedCookies && req.signedCookies.ltiUserId)
    return req.signedCookies.ltiUserId;
  return null;
}

async function saveTokenToDb(userId, provider, tokenData) {
  const { access_token, refresh_token, expires_in } = tokenData;
  const expires_at = expires_in
    ? new Date(Date.now() + (expires_in - 60) * 1000)
    : null;
  await Token.findOneAndUpdate(
    { userId, provider },
    { access_token, refresh_token, expires_at },
    { upsert: true, new: true }
  );
}

async function getOrRenewToken({
  userId,
  provider,
  getNewTokenFn,
  getRefreshTokenFn = null,
}) {
  if (!userId) return null;
  let tokenDoc = await Token.findOne({ userId, provider });
  const now = new Date();

  if (tokenDoc && tokenDoc.access_token && tokenDoc.expires_at > now) {
    return tokenDoc.access_token;
  }

  if (getRefreshTokenFn && tokenDoc?.refresh_token) {
    try {
      const tokenData = await getRefreshTokenFn(tokenDoc.refresh_token);
      await saveTokenToDb(userId, provider, tokenData);
      return tokenData.access_token;
    } catch (err) {
      await Token.deleteOne({ userId, provider });
    }
  }

  const newToken = await getNewTokenFn();
  if (!newToken?.access_token) return null;
  await saveTokenToDb(userId, provider, newToken);
  return newToken.access_token;
}

module.exports = {
  setSignedCookie,
  clearSignedCookie,
  handleError,
  buildOAuthAuthUrl,
  fetchImageBuffer,
  hasAllowedRole,
  unflatten,
  getUserId,
  getOrRenewToken,
  saveTokenToDb,
};
