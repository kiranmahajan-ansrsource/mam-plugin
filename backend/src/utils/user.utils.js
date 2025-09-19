function getUserId(req, res) {
  if (res.locals?.context?.user) return res.locals.context.user;
  if (req.signedCookies && req.signedCookies.ltiUserId)
    return req.signedCookies.ltiUserId;
  return null;
}

function getUserEmail(req, res) {
  const ctx = res.locals?.context;
  const token = res.locals?.token;

  const emailFromContext = ctx?.userInfo?.email || ctx?.userEmail || null;
  if (emailFromContext) return String(emailFromContext).trim();

  const emailFromToken = token?.userInfo?.email || token?.platformContext?.user?.email;
  if (emailFromToken) return String(emailFromToken).trim();

  return null;
}

module.exports = { getUserId, getUserEmail };
