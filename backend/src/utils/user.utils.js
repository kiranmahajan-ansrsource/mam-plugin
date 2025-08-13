function getUserId(req, res) {
  if (res.locals?.context?.user) return res.locals.context.user;
  if (req.signedCookies && req.signedCookies.ltiUserId)
    return req.signedCookies.ltiUserId;
  return null;
}
module.exports = { getUserId };
