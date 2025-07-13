const path = require("path");
const lti = require("ltijs").Provider;
const routes = require("./routes/routes");
const isDev = process.env.NODE_ENV !== "production";
const publicPath = path.join(__dirname, "../public");
const COOKIE_SECRET = process.env.LTI_KEY;

lti.setup(
  process.env.LTI_KEY,
  {
    url: process.env.MONGODB_URI,
  },
  {
    staticPath: publicPath,
    cookies: {
      secure: !isDev,
      sameSite: isDev ? "Lax" : "None",
    },
    devMode: isDev,
  },
  COOKIE_SECRET
);

lti.whitelist(
  "/assets",
  "/favicon.ico",
  "/lang/en.js",
  "/oauth/login",
  "/oauth/callback",
  "/api/d2l-auth-status"
);

lti.onConnect(async (token, req, res) => {
  return res.sendFile(path.join(publicPath, "index.html"));
});

lti.onDeepLinking(async (token, req, res) => {
  return lti.redirect(res, "/deeplink", { newResource: true });
});

lti.app.use(routes);

const setup = async () => {
  await lti.deploy({ port: process.env.PORT });
  await lti.registerPlatform({
    url: process.env.PLATFORM_URL,
    name: "Brightspace",
    clientId: process.env.CLIENT_ID,
    authenticationEndpoint: process.env.AUTH_URL,
    accesstokenEndpoint: process.env.TOKEN_URL,
    authConfig: { method: "JWK_SET", key: process.env.KEYSET_URL },
  });
};
setup();
