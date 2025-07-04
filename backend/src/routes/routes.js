const router = require("express").Router();
const path = require("path");
const lti = require("ltijs").Provider;
const axios = require("axios");
const { getAccessToken } = require("../controllers/mayo.controller");

const publicPath = path.join(__dirname, "../../public");

router.get("/deeplink", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

router.get("/api/images", async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const mayoResponse = await axios.get(process.env.MAYO_IMG_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        query: req.query.q,
        pagenumber: req.query.page,
        countperpage: req.query.limit,
        format: "json",
        fields:
          "Path_TR7,Path_TR1,Title,SystemIdentifier,IncludeInheritedKeywords,CreateDate",
      },
    });

    const items = mayoResponse?.data?.APIResponse?.Items || [];
    const total = mayoResponse?.data?.APIResponse?.GlobalInfo?.TotalCount || 0;

    res.json({ results: items, total });
  } catch (err) {
    console.error("[/api/images] ERROR:", err?.message || err);
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

router.get("/details", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
router.post("/details", (req, res) => {
  const params = new URLSearchParams(req.body).toString();
  res.redirect(`/details?${params}`);
});

router.post("/api/validate-selection", async (req, res) => {
  try {
    const { imageUrl, imageId, altText } = req.body;

    if (!imageUrl || !imageId) {
      return res.status(400).json({ error: "Missing required image data" });
    }

    const tempItem = {
      type: "ltiResourceLink",
      url: imageUrl,
      title: "Selected Image",
      text: altText || "Selected image for insertion",
      custom: {
        imageId: imageId,
        stage: "details",
      },
    };

    const form = await lti.DeepLinking.createDeepLinkingMessage(
      res.locals.token,
      tempItem,
      { message: "Image selected. Click Next to proceed." }
    );

    return res.json({ success: true, ready: true });
  } catch (err) {
    console.error("[/details] ERROR:", err?.message || err);
    return res.status(500).json({ error: "Failed to validate selection" });
  }
});

router.post("/insert", async (req, res) => {
  try {
    const { imageUrl, altText } = req.body;

    if (!imageUrl || !altText) {
      return res.status(400).send("Missing imageUrl or altText");
    }

    const item = {
      type: "image",
      url: imageUrl,
      title: altText,
      text: altText,
      width: 500,
      height: 300,
      custom: {
        altText: altText,
        insertType: "image",
      },
    };

    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      item,
      { message: "Image successfully inserted!" }
    );

    return res.send(form);
  } catch (err) {
    console.error("[/insert] ERROR:", err?.message || err);
    return res.status(500).send("Failed to insert image.");
  }
});

router.get("/*splat", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

module.exports = router;
