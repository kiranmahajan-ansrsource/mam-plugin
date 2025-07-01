const router = require("express").Router();
const axios = require("axios");
const { getAccessToken } = require("../controllers/mayo.controller");

router.post("/search", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { query } = req.body;
    const response = await axios.post(
      process.env.MAYO_IMG_SEARCH_URL,
      { query },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const images =
      response.data.images || response.data.results || response.data;
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
