const router = require("express").Router();
const path = require("path");
const lti = require("ltijs").Provider;

const publicPath = path.join(__dirname, "../../public");

router.get("/deeplink", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// optional for now since no post request is being made we are just getting html
router.post("/deeplink", async (req, res) => {
  try {
    const resource = req.body;

    const items = {
      type: "ltiResourceLink",
      title: "Ltijs Demo",
      custom: {
        name: resource.name,
        value: resource.value,
      },
    };

    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "Successfully Registered" }
    );
    if (form) return res.send(form);
    return res.sendStatus(500);
  } catch (err) {
    console.log(err.message);
    return res.status(500).send(err.message);
  }
});
// Ignore above for now

router.get("/*splat", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

module.exports = router;
