const axios = require("axios");

const fetchImageBuffer = async (imageUrl) => {
  console.log(`Image Service: Fetching image buffer from: ${imageUrl}`);
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = response.headers["content-type"];
  if (!contentType || !contentType.startsWith("image/")) {
    throw new Error(
      `Invalid content type for image URL: ${contentType || "Not provided"}`
    );
  }
  console.log(`Image Service: Fetched image with content type: ${contentType}`);
  return { buffer: response.data, contentType };
};

module.exports = {
  fetchImageBuffer,
};
