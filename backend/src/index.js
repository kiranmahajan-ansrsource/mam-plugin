const express = require("express");
const path = require("path");
const lti = require("ltijs").Provider;
const { DeepLinkingService } = require("ltijs");

lti.setup(
  process.env.LTI_KEY,
  {
    url: process.env.MONGODB_URI,
    connection: { user: "", pass: "" },
  },
  {
    appRoute: "/",
    cookies: {
      secure: true,
      sameSite: "None",
    },
    devMode: false,
  }
);

lti.onConnect((token, req, res) => {
  console.log("LTI Launch successful", token);
  return lti.redirect(res, "/");
});

lti.onDeepLinking(async (token, req, res) => {
  console.log("Deep Linking initiated", token);

  const items = [
    {
      type: "ltiResourceLink",
      title: "MAM Plugin Tool Test",
      url: "https://mam-plugin-624886803499.us-central1.run.app/",
      custom: {
        info: "launched-via-deep-linking",
      },
    },
  ];

  const response = await DeepLinkingService.createDeepLinkingResponse(
    token,
    items
  );
  return res.send(response);
});

const setup = async () => {
  await lti.deploy({ port: process.env.PORT || 8080 });

  lti.app.use("/", express.static(path.join(__dirname, "public")));

  await lti.registerPlatform({
    url: process.env.PLATFORM_URL,
    name: "Brightspace",
    clientId: process.env.CLIENT_ID,
    authenticationEndpoint: process.env.AUTH_ENDPOINT,
    accesstokenEndpoint: process.env.TOKEN_ENDPOINT,
    authConfig: { method: "JWK_SET", key: process.env.JWKS_URL },
  });
};
setup();
