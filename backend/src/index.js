const path = require("path");
const lti = require("ltijs").Provider;
const routes = require("./routes/routes");
const isDev = process.env.NODE_ENV !== "production";
const publicPath = path.join(__dirname, "../public");

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
  }
);
lti.whitelist("/assets", "/favicon.ico", "/lang", "/api");

lti.onConnect(async (token, req, res) => {
  res.locals.token = token;
  return res.sendFile(path.join(publicPath, "index.html"));
});

lti.onDeepLinking(async (token, req, res) => {
  res.locals.token = token;

  const deepLinkingSettings = {
    accept_types: ["image", "ltiResourceLink"],
    accept_presentation_document_targets: ["iframe", "window"],
    accept_media_types: ["image/*"],
    auto_create: true,
    accept_multiple: false,
    accept_lineitem: false,
    accept_copy_advice: false,
  };

  res.set("X-DeepLinking-Settings", JSON.stringify(deepLinkingSettings));

  return lti.redirect(res, "/deeplink", {
    newResource: true,
    ltik: token,
  });
});

lti.app.use((req, res, next) => {
  if (req.query.ltik && !res.locals.token) {
    try {
      const token = lti.getToken(req.query.ltik);
      res.locals.token = token;
    } catch (error) {
      console.error("Token retrieval error:", error);
    }
  }
  next();
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
setup().catch(console.error);
