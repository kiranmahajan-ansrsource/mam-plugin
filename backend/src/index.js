const path = require("path");
const lti = require("ltijs").Provider;
const deeplinkRoutes = require("./routes/deeplink.route");
const mayoRoutes = require("./routes/mayo.route");
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
lti.whitelist("/assets", "/favicon.ico");

lti.onConnect(async (token, req, res) => {
  console.log("⚠️onConnect Launch⚠️ ", token);
  return res.send("User connected!");
});

lti.onDeepLinking(async (token, req, res) => {
  console.log("⚠️onDeepLinking Launch⚠️", token);
  return lti.redirect(res, "/deeplink", { newResource: true });
});

lti.app.use(deeplinkRoutes);
lti.app.use("/mayo", mayoRoutes);

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
