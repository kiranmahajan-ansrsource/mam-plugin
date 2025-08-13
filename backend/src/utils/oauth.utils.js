function buildOAuthUrl(state) {
  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.D2L_OAUTH_CLIENT_ID,
    redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
    scope: "content:modules:* content:topics:* core:*:*",
    state,
  });
  return `${process.env.D2L_OAUTH_URL}?${queryParams}`;
}

module.exports = { buildOAuthUrl };
