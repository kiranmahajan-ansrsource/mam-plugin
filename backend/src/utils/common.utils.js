const axios = require("axios");

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

function buildOAuthTokenPayload(code) {
  return new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
    client_id: process.env.D2L_OAUTH_CLIENT_ID,
    client_secret: process.env.D2L_OAUTH_CLIENT_SECRET,
  });
}

async function fetchImageBuffer(imageUrl) {
  console.log(`Image Service: Fetching image buffer from: ${imageUrl}`);
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

module.exports = {
  setSignedCookie,
  clearSignedCookie,
  handleError,
  buildOAuthAuthUrl,
  buildOAuthTokenPayload,
  fetchImageBuffer,
  hasAllowedRole,
};
