const express = require("express");
const path = require("path");
const lti = require("ltijs").Provider;

lti.setup(
  process.env.LTI_KEY,
  {
    url: process.env.MONGODB_URI,
    connection: { user: "", pass: "" },
  },
  {
    appRoute: "/",
    cookies: {
      secure: false,
      sameSite: "",
    },
    devMode: false,
  }
);

lti.onConnect((token, req, res) => {
  console.log(token);
  return res.redirect("/");
});

const setup = async () => {
  await lti.deploy({ port: 3000 });

  lti.app.use("/", express.static(path.join(__dirname, "../../frontend")));
  //   console.log(path.join(__dirname, "../../frontend"));

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
