const router = require("express").Router();
const path = require("path");
const lti = require("ltijs").Provider;
const axios = require("axios");
const { getAccessToken } = require("../controllers/mayo.controller");

const publicPath = path.join(__dirname, "../../public");

router.get("/search", async (req, res) => {
  try {
    const token = res.locals.token;
    const accessToken = await getAccessToken();

    const mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        query: req.query.q || "x-ray",
        pagenumber: req.query.page || 1,
        countperpage: req.query.limit || 18,
        format: "json",
        fields: "SystemIdentifier,Title,Path_TR7",
      },
    });

    const items = mayoResponse?.data?.APIResponse?.Items || [];
    const total = mayoResponse?.data?.APIResponse?.GlobalInfo?.TotalCount || 0;

    console.log("[MAYO SEARCH] Mayo API returned items:", items);

    res.json({ results: items, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
