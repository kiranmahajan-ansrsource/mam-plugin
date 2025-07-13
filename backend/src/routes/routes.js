const router = require("express").Router();
const path = require("path");
const lti = require("ltijs").Provider;
const axios = require("axios");
const { getAccessToken } = require("../controllers/mayo.controller");
const crypto = require("crypto");

const publicPath = path.join(__dirname, "../../public");

router.get("/oauth/login", (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");

    let returnToUrl = "/deeplink";
    if (req.query.returnTo) {
      returnToUrl = req.query.returnTo;
    } else {
      console.log(
        `No specific returnTo URL provided, defaulting to: ${returnToUrl}`
      );
    }

    res.cookie(
      "oauthState",
      { state, returnTo: returnToUrl },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        signed: true,
        sameSite: "None",
        maxAge: 300000,
      }
    );
    console.log("OAuth state and returnTo URL stored in signed cookie.");

    if (
      !process.env.D2L_OAUTH_CLIENT_ID ||
      !process.env.D2L_OAUTH_REDIRECT_URI ||
      !process.env.D2L_OAUTH_URL
    ) {
      console.error(
        "Missing D2L OAuth environment variables. Please check .env file."
      );
      return res
        .status(500)
        .send(
          "Server configuration error: D2L OAuth environment variables are not set."
        );
    }

    const queryParams = new URLSearchParams({
      response_type: "code",
      client_id: process.env.D2L_OAUTH_CLIENT_ID,
      redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
      scope: "content:modules:* content:topics:* core:*:*",
      state: state,
    });

    const authUrl = `${process.env.D2L_OAUTH_URL}?${queryParams}`;
    console.log(`Redirecting to D2L OAuth URL: ${authUrl}`);
    return lti.redirect(res, authUrl);
  } catch (error) {
    console.error("[/oauth/login] Uncaught error:", error.message || error);
    return res
      .status(500)
      .send("An unexpected error occurred during OAuth login initiation.");
  }
});

router.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;

  let storedStateData;
  let returnToUrl = "/deeplink";

  try {
    storedStateData = req.signedCookies.oauthState;

    if (!storedStateData) {
      console.error(
        "[OAuth Callback] ERROR: Signed OAuth state cookie not found or tampered. Possible CSRF or expired cookie."
      );
      return res
        .status(403)
        .send(
          "Authentication failed: Invalid or missing state. Please try logging in again."
        );
    }

    const { state: storedState, returnTo: storedReturnTo } = storedStateData;
    returnToUrl = storedReturnTo || returnToUrl;

    if (!state || state !== storedState) {
      console.error(
        "[OAuth Callback] ERROR: Invalid or missing state parameter from D2L callback. Possible CSRF attack."
      );
      return res
        .status(403)
        .send("Invalid OAuth state. Please try logging in again.");
    }
    res.clearCookie("oauthState", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      sameSite: "None",
    });
    console.log("OAuth state validated and cookie cleared successfully.");

    if (!code) {
      console.error("[OAuth Callback] ERROR: Missing code parameter from D2L.");
      return res.status(400).send("Missing code param");
    }

    if (
      !process.env.D2L_OAUTH_TOKEN_URL ||
      !process.env.D2L_OAUTH_REDIRECT_URI ||
      !process.env.D2L_OAUTH_CLIENT_ID ||
      !process.env.D2L_OAUTH_CLIENT_SECRET
    ) {
      console.error(
        "Missing D2L OAuth token exchange environment variables. Please check .env file."
      );
      return res
        .status(500)
        .send(
          "Server configuration error: D2L OAuth token exchange variables are not set."
        );
    }

    const payload = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.D2L_OAUTH_REDIRECT_URI,
      client_id: process.env.D2L_OAUTH_CLIENT_ID,
      client_secret: process.env.D2L_OAUTH_CLIENT_SECRET,
    });

    console.log("Attempting to exchange OAuth code for token...");
    const tokenRes = await axios.post(
      process.env.D2L_OAUTH_TOKEN_URL,
      payload.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenRes.data;

    console.log("Access Token obtained successfully.✅✅✅", access_token);

    res.cookie("d2lAccessToken", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 3600000,
    });

    console.log(`Redirecting to original URL: ${returnToUrl}`);
    return res.redirect(returnToUrl);
  } catch (err) {
    console.error(
      "[OAuth Callback] ERROR during token exchange or processing:",
      err?.response?.data || err.message || err
    );
    if (axios.isAxiosError(err) && err.response) {
      console.error("D2L Token Exchange Response Status:", err.response.status);
      console.error("D2L Token Exchange Response Data:", err.response.data);
    }
    res.clearCookie("oauthState", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      sameSite: "None",
    });
    return res
      .status(500)
      .send("OAuth token exchange failed or an unexpected error occurred.");
  }
});

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

router.get("/api/d2l-auth-status", (req, res) => {
  const d2lAccessToken = req.cookies.d2lAccessToken;
  if (d2lAccessToken) {
    return res.json({ authenticated: true });
  } else {
    return res.json({ authenticated: false });
  }
});

router.post("/insert", async (req, res) => {
  let moduleId, topicId;
  let orgUnitId;

  try {
    const { imageUrl, title, altText } = req.body;
    if (!imageUrl || !title || !altText) {
      console.error(
        "[/insert] ERROR: Missing imageUrl, title, or altText in request body."
      );
      return res
        .status(400)
        .send("Missing imageUrl, title, or altText in request body.");
    }

    const decodedImageUrl = decodeURIComponent(imageUrl);
    console.log(`Decoded Image URL for fetch: ${decodedImageUrl}`);

    orgUnitId = res.locals.context.context.id;
    console.log(orgUnitId + "✅✅✅");
    const d2lAccessToken = req.cookies.d2lAccessToken;

    if (!d2lAccessToken) {
      console.error(
        "D2L Access Token not found in cookies. User needs to re-authenticate via OAuth."
      );
      return res
        .status(401)
        .send(
          "D2L Access Token missing. Please complete the OAuth login process first."
        );
    }

    if (!process.env.D2L_API_BASE_URL) {
      console.error(
        "Missing D2L_API_BASE_URL environment variable. Cannot make D2L API calls."
      );
      return res
        .status(500)
        .send("Server configuration error: D2L API Base URL is not set.");
    }

    console.log("Attempting to create temporary module...");
    const moduleResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/`,
      {
        Title: `Temp Image Module - ${Date.now()}`,
        IsHidden: true,
      },
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    moduleId = moduleResponse.data.Id;
    console.log(`Successfully created temporary module with ID: ${moduleId}`);

    console.log("Attempting to create temporary topic...");
    const topicResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/${moduleId}/topics/`,
      {
        Title: `Temp Image Topic - ${Date.now()}`,
        IsHidden: true,
        OpenAsExternalResource: false,
        Type: 1,
        Url: "",
      },
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    topicId = topicResponse.data.TopicId;
    console.log(`Successfully created temporary topic with ID: ${topicId}`);

    console.log(`Fetching external image from URL: ${decodedImageUrl}`);
    const imageFetchResponse = await axios.get(decodedImageUrl, {
      responseType: "arraybuffer",
    });
    const imageData = imageFetchResponse.data;

    const contentType =
      imageFetchResponse.headers["content-type"] || "application/octet-stream";

    const fileExtension = contentType.split("/").pop() || "bin";

    const fileName = `${title.replace(
      /[^a-zA-Z0-9_.-]/g,
      ""
    )}_${Date.now()}.${fileExtension}`;
    console.log(
      `Fetched image with content type: ${contentType} and proposed filename: ${fileName}`
    );

    console.log(`Uploading image '${fileName}' to D2L topic ${topicId}...`);
    const uploadResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/topics/${topicId}/file`,
      imageData,
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
          "Content-Type": contentType,
          "x-file-name": fileName,
        },
      }
    );
    const fileId = uploadResponse.data.FileId;
    console.log(`Image uploaded to D2L. FileId: ${fileId}`);

    console.log(`Retrieving D2L URL for FileId: ${fileId}`);
    const fileDetailsResponse = await axios.get(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/files/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
        },
      }
    );
    const d2lImageUrl = fileDetailsResponse.data.Path;
    console.log(`Retrieved D2L Image URL: ${d2lImageUrl}`);

    const finalHtmlFragment = `
      <img src="${d2lImageUrl}"
           alt="${altText}"
           title="${title}"
           style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;">
    `;
    console.log("Generated HTML fragment for deep linking.");

    const items = [
      {
        type: "html",
        html: finalHtmlFragment,
        title: title,
        text: title,
      },
    ];

    console.log("Creating Deep Linking Form...");
    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "Image inserted successfully into D2L!" }
    );
    console.log("Deep Link Items Sent.");
    return form ? res.send(form) : res.sendStatus(500);
  } catch (err) {
    console.error(
      "[/insert image] ERROR:",
      err?.response?.data || err.message || err
    );
    if (axios.isAxiosError(err)) {
      console.error("Axios Error Code:", err.code);
      console.error("Axios Error Message:", err.message);
      console.error("Axios Request URL:", err.config?.url);
      if (err.response) {
        console.error("Axios Error Response Status:", err.response.status);
        console.error("Axios Error Response Data:", err.response.data);
      }
    }

    return res
      .status(500)
      .send(
        `Failed to insert image: ${err.message || "An unknown error occurred."}`
      );
  } finally {
    const d2lAccessToken = req.cookies.d2lAccessToken;

    if (d2lAccessToken && orgUnitId) {
      if (topicId) {
        try {
          console.log(
            `Attempting to delete temporary topic with ID: ${topicId}`
          );
          await axios.delete(
            `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/${moduleId}/topics/${topicId}`,
            {
              headers: { Authorization: `Bearer ${d2lAccessToken}` },
            }
          );
          console.log(`Successfully deleted temporary topic ${topicId}.`);
        } catch (deleteTopicErr) {
          console.error(
            `Error deleting topic ${topicId}:`,
            deleteTopicErr?.response?.data || deleteTopicErr.message
          );
        }
      }

      if (moduleId) {
        try {
          console.log(
            `Attempting to delete temporary module with ID: ${moduleId}`
          );
          await axios.delete(
            `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/${moduleId}`,
            {
              headers: { Authorization: `Bearer ${d2lAccessToken}` },
            }
          );
          console.log(`Successfully deleted temporary module ${moduleId}.`);
        } catch (deleteModuleErr) {
          console.error(
            `Error deleting module ${moduleId}:`,
            deleteModuleErr?.response?.data || deleteModuleErr.message
          );
        }
      }
    } else {
      console.warn(
        "Skipping cleanup: D2L Access Token or orgUnitId not available for deletion."
      );
    }
  }
});

router.get("/*splat", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

module.exports = router;
