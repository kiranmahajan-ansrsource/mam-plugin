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
  lti.redirect(res, `/details?${params}`);
});

router.post("/insert", async (req, res) => {
  try {
    const { htmlFragment, title } = req.body;
    if (!htmlFragment) return res.status(400).send("Missing htmlFragment");

    const items = [
      {
        type: "html",
        html: htmlFragment,
        title,
        text: title,
      },
    ];

    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "HTML fragment inserted!" }
    );
    console.log("Deep Link Items Sent:\n", items);
    console.log("Deep Link form Sent:\n", form);
    return form ? res.send(form) : res.sendStatus(500);
  } catch (err) {
    console.error("[/insert html] ERROR:", err?.message || err);
    return res.status(500).send(err.message);
  }
});

router.get("/*splat", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

module.exports = router;
