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
    console.log(`Generated OAuth state: ${state}`);
    console.log(`Generated and stored OAuth state: ${state}`);

    let returnToUrl = "/deeplink";
    if (req.query.returnTo) {
      returnToUrl = req.query.returnTo;
      console.log(`Using returnTo URL from query: ${returnToUrl}`);
    } else {
      console.log(
        `No specific returnTo URL provided, defaulting to: ${returnToUrl}`
      );
    }

    res.cookie(
      "oauthState",
      { state, returnTo: returnToUrl },
      {
        httpOnly: true, // Prevents client-side JavaScript access
        secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
        signed: true, // IMPORTANT: Marks this cookie as signed
        sameSite: "None", // Or 'None' if cross-site iframe and secure: true
        maxAge: 300000, // Cookie valid for 5 minutes (300 seconds) - sufficient for OAuth flow
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
      state: state, // Use the dynamically generated state
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
  const { code, state } = req.query; // Get code and state from query parameters

  let storedStateData;
  let returnToUrl = "/deeplink"; // Default fallback if returnTo is not found in cookie

  try {
    // Retrieve and parse the signed cookie.
    // req.signedCookies is populated by cookie-parser, which ltijs uses internally.
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

    // Extract state and returnTo from the stored data
    const { state: storedState, returnTo: storedReturnTo } = storedStateData;
    returnToUrl = storedReturnTo || returnToUrl; // Use stored returnTo, fallback to default

    // 1. Validate the 'state' parameter received from D2L against the stored state
    if (!state || state !== storedState) {
      console.error(
        "[OAuth Callback] ERROR: Invalid or missing state parameter from D2L callback. Possible CSRF attack."
      );
      return res
        .status(403)
        .send("Invalid OAuth state. Please try logging in again.");
    }

    // Clear the signed cookie after successful validation to prevent replay attacks
    // It's important to use the same options (especially 'signed', 'secure', 'sameSite')
    // when clearing the cookie as when setting it.
    res.clearCookie("oauthState", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      sameSite: "Lax",
    });
    console.log("OAuth state validated and cookie cleared successfully.");

    if (!code) {
      console.error("[OAuth Callback] ERROR: Missing code parameter from D2L.");
      return res.status(400).send("Missing code param");
    }

    // Check for essential environment variables before proceeding
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

    // Prepare payload for token exchange
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

    console.log(
      "Access Token obtained successfully.✅✅✅✅✅✅✅✅✅✅✅",
      access_token
    );

    // Set the D2L access token in a secure, HTTP-only cookie.
    res.cookie("d2lAccessToken", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "Lax", // 'None' if cross-site iframe and secure: true
      maxAge: 3600000, // Cookie expires in 1 hour (adjust based on D2L token validity)
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
    // Ensure the state cookie is cleared even on error to prevent issues
    res.clearCookie("oauthState", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      sameSite: "Lax",
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
    // if (!imageUrl || !title || !altText) {
    //   console.error(
    //     "[/insert] ERROR: Missing imageUrl, title, or altText in request body."
    //   );
    //   return res
    //     .status(400)
    //     .send("Missing imageUrl, title, or altText in request body.");
    // }

    orgUnitId = res.locals.context.context.id;
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

    // --- D2L API Operations ---

    // 1. Create a Temporary Module in D2L
    console.log("Attempting to create temporary module...");
    const moduleResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/`,
      {
        Title: `Temp Image Module - ${Date.now()}`, // Unique title for temporary module
        IsHidden: true, // Hide this module from students
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

    // 2. Create a Temporary Topic within the newly created module.
    // This topic will serve as a container for the uploaded image file.
    console.log("Attempting to create temporary topic...");
    const topicResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/${moduleId}/topics/`,
      {
        Title: `Temp Image Topic - ${Date.now()}`, // Unique title for temporary topic
        IsHidden: true, // Hide this topic from students
        OpenAsExternalResource: false, // This topic will contain an internal file
        Type: 1, // Type 1 indicates a 'File' topic in D2L
        Url: "", // Placeholder URL; the actual file path will be set by the file upload
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

    // 3. Fetch the External Image Data
    console.log(`Fetching external image from URL: ${imageUrl}`);
    const imageFetchResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer", // Retrieve image as binary data (ArrayBuffer)
    });
    const imageData = imageFetchResponse.data;
    // Determine content type from response headers, default to octet-stream
    const contentType =
      imageFetchResponse.headers["content-type"] || "application/octet-stream";
    // Derive file extension from content type, default to 'bin'
    const fileExtension = contentType.split("/").pop() || "bin";
    // Create a sanitized filename for the uploaded image
    const fileName = `${title.replace(
      /[^a-zA-Z0-9_.-]/g,
      ""
    )}_${Date.now()}.${fileExtension}`;
    console.log(
      `Fetched image with content type: ${contentType} and proposed filename: ${fileName}`
    );

    // 4. Upload the Fetched Image to D2L Course Files, associated with the Temporary Topic
    console.log(`Uploading image '${fileName}' to D2L topic ${topicId}...`);
    const uploadResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/topics/${topicId}/file`,
      imageData, // Raw binary image data
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
          "Content-Type": contentType, // Use the actual content type of the image
          "x-file-name": fileName, // D2L requires this header to specify the filename
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

    // 6. Generate the <img> tag with the D2L URL
    const finalHtmlFragment = `
      <img src="${d2lImageUrl}"
           alt="${altText}"
           title="${title}"
           style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;">
    `;
    console.log("Generated HTML fragment for deep linking.");

    // --- Deep Linking ---
    // Prepare the items array for the Deep Linking form.
    // We are sending an HTML fragment back to D2L.
    const items = [
      {
        type: "html", // Specifies that the content is an HTML fragment
        html: finalHtmlFragment,
        title: title, // Use the original title for the deep link item
        text: title, // Text representation for the deep link
      },
    ];

    console.log("Creating Deep Linking Form...");
    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token, // The LTI launch token
      items,
      { message: "Image inserted successfully into D2L!" } // Optional message for the platform
    );
    console.log("Deep Link Items Sent.");
    // console.log("Deep Link form Sent:\n", form); // Avoid logging large forms in production

    // Send the deep linking form back to D2L.
    // D2L will then process this form and insert the content.
    return form ? res.send(form) : res.sendStatus(500);
  } catch (err) {
    console.error("[/insert image] ERROR:", err?.response?.data || err.message);
    // Send a user-friendly error message
    return res.status(500).send(`Failed to insert image: ${err.message}`);
  } finally {
    // --- Cleanup: Delete Temporary Topic and Module ---
    // This block ensures that temporary resources are removed even if an error occurs.
    const d2lAccessToken = req.cookies.d2lAccessToken; // Re-get token for cleanup context

    if (d2lAccessToken && orgUnitId) {
      // Ensure token and orgUnitId are available for cleanup
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
