import axios from "axios";

export async function getBase64FromImageUrl(imageUrl) {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const contentType = response.headers["content-type"] || "image/jpeg";
  const base64 = Buffer.from(response.data).toString("base64");

  return { base64, contentType };
}
export async function fetchImageBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const contentType = response.headers["content-type"];
    return { buffer: response.data, contentType };
  } catch (err) {
    console.error(`Error fetching image from URL: ${url}`, err.message);
    throw new Error(`Failed to fetch image from URL: ${url}`);
  }
}
