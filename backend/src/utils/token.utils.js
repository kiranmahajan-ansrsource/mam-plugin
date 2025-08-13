const Token = require("../model/token.model");
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

module.exports = { saveTokenToDb, getOrRenewToken };
