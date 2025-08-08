require("dotenv").config();
const { validateEnv } = require("./env");
const path = require("path");
const lti = require("ltijs").Provider;
const routes = require("./routes");
const { logDecodedJwt } = require("./jwtLogger");
const { hasAllowedRole, setSignedCookie } = require("./utils/common.utils");
const isDev = process.env.NODE_ENV !== "production";
const publicPath = path.join(__dirname, "../public");
const COOKIE_SECRET = process.env.LTI_KEY;

validateEnv();

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

lti.onInvalidToken((req, res) => {
  if (res?.locals?.err?.details?.message === "TOKEN_TOO_OLD") {
    return res.redirect("/login");
  }
  return res.status(401).send(res.locals.err);
});

lti.whitelist(
  "/assets",
  "/favicon.ico",
  "/lang/en.js",
  "/oauth/login",
  "/oauth/callback",
  "/oauth/check"
);

lti.onConnect(async (token, req, res) => {
  const userRoles = token.platformContext?.roles || [];

  if (!req.signedCookies?.ltiUserId && token.user) {
    setSignedCookie(res, "ltiUserId", token.user, {
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  if (!hasAllowedRole(userRoles)) {
    return lti.redirect(res, "/prohibited");
  }
  return res.sendFile(path.join(publicPath, "index.html"));
});

lti.onDeepLinking(async (token, req, res) => {
  logDecodedJwt("Deep Linking Request", token, "request");
  if (!req.signedCookies?.ltiUserId && token.user) {
    setSignedCookie(res, "ltiUserId", token.user, {
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  const userRoles = token.platformContext?.roles || [];
  if (!hasAllowedRole(userRoles)) {
    console.log("Access denied");
    return lti.redirect(res, "/prohibited");
  }
  return lti.redirect(res, "/deeplink", { newResource: true });
});

lti.app.use(routes);

const setup = async () => {
  await lti.deploy({ port: process.env.PORT, silent: true });
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
