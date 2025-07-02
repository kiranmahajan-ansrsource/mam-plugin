const router = require("express").Router();
const path = require("path");
const lti = require("ltijs").Provider;
const axios = require("axios");
const { getAccessToken } = require("../controllers/mayo.controller");

const publicPath = path.join(__dirname, "../../public");

router.get("/search", async (req, res) => {
  try {
    console.log("[/search] Query:", req.query);
    console.log(
      "[/search] MAYO_IMG_SEARCH_URL:",
      process.env.MAYO_IMG_SEARCH_URL
    );

    const token = res.locals.token;
    const accessToken = await getAccessToken();

    console.log("[/search] Got Mayo access token:", !!accessToken);

    const mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        query: req.query.q || "x-ray",
        pagenumber: req.query.page || 1,
        countperpage: req.query.limit || 18,
        format: "json",
        fields:
          "Path_TR7,Path_TR1,Title,SystemIdentifier,IncludeInheritedKeywords,CreateDate",
      },
    });

    const items = mayoResponse?.data?.APIResponse?.Items || [];
    const total = mayoResponse?.data?.APIResponse?.GlobalInfo?.TotalCount || 0;

    console.log("[MAYO SEARCH] Mayo API returned items:", items);

    res.json({ results: items, total });
  } catch (err) {
    console.error("[/search] ERROR:", err && err.stack ? err.stack : err);
    if (err.response) {
      console.error("[/search] Mayo API error response:", err.response.data);
      res.status(err.response.status || 500).json({ error: err.response.data });
    } else {
      res.status(500).json({ error: err.message });
    }
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
