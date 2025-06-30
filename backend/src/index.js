const path = require("path");
const LTI = require("ltijs").Provider;

LTI.setup(
  process.env.LTI_KEY,
  {
    url: process.env.MONGODB_URI,
  },
  {
    appRoute: "/lti/launch",
    loginRoute: "/lti/login",
    keysetRoute: "/lti/keys",
    cookies: {
      secure: true,
      sameSite: "None",
    },
    devMode: false,
  }
);

LTI.onConnect((token, req, res) => {
  console.log("⚠️onConnect Launch⚠️");
  return res.sendFile(path.join(__dirname, "public/index.html"));
});

LTI.onDeepLinking((token, req, res) => {
  console.log("⚠️onDeepLinking Launch⚠️");
  return LTI.redirect(res, "/lti/deeplink", { newResource: true });
});

LTI.app.get("/lti/deeplink", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

LTI.app.post("/lti/deeplink", async (req, res) => {
  const selection = req.body.product;
  const items = [
    {
      type: "ltiResourceLink",
      title: selection,
      url: `${process.env.APP_URL}/lti/launch`,
      custom: { product: selection },
    },
  ];

  const form = await LTI.DeepLinking.createDeepLinkingForm(
    res.locals.token,
    items,
    {
      message: "Item added successfully!",
    }
  );
  return res.send(form);
});

const start = async () => {
  await LTI.deploy({ port: process.env.PORT || 8080 });
  await LTI.registerPlatform({
    url: process.env.PLATFORM_URL,
    name: "Brightspace",
    clientId: process.env.CLIENT_ID,
    authenticationEndpoint: process.env.AUTH_URL,
    accesstokenEndpoint: process.env.TOKEN_URL,
    authConfig: { method: "JWK_SET", key: process.env.KEYSET_URL },
  });
};
start();
