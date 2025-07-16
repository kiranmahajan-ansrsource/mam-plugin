const lti = require("ltijs").Provider;
const axios = require("axios");
const { fetchImageBuffer, handleError } = require("../utils/common.utils");

const publicInsertController = async (req, res) => {
  let moduleId, topicId;
  let orgUnitId;
  try {
    const { imageUrl, title, altText, imageId, decorative } = req.body;
    if (!imageUrl) {
      return handleError(res, 400, "Missing imageUrl in request body.");
    }
    const decodedImageUrl = decodeURIComponent(imageUrl);
    console.log(`Decoded Image URL for fetch: ${decodedImageUrl}`);
    if (
      !res.locals.context ||
      !res.locals.context.context ||
      !res.locals.context.context.id
    ) {
      console.error(
        "[/insert] ERROR: LTI context or context ID missing. Please launch the tool from D2L."
      );
      return handleError(
        res,
        401,
        "LTI context missing. Please launch the tool from D2L."
      );
    }
    orgUnitId = res.locals.context.context.id;
    const orgId = res.locals.context.context.label;
    console.log(`Processing /insert for orgUnitId: ${orgUnitId}✅✅✅`);
    const d2lAccessToken = req.cookies.d2lAccessToken;
    if (!d2lAccessToken) {
      console.error(
        "D2L Access Token not found in cookies. User needs to re-authenticate via OAuth."
      );
      return handleError(
        res,
        401,
        "D2L Access Token missing. Please complete the OAuth login process first."
      );
    }
    if (!process.env.D2L_API_BASE_URL) {
      console.error(
        "Missing D2L_API_BASE_URL environment variable. Cannot make D2L API calls."
      );
      return handleError(
        res,
        500,
        "Server configuration error: D2L API Base URL is not set."
      );
    }
    // --- Step 1: Create a Temporary Module (Top-Level) ---
    const moduleResponse = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/root/`,
      {
        Title: `Temp Image Module - ${Date.now()}`,
        ShortTitle: `Temp Mod ${Date.now()}`,
        IsHidden: true,
        Type: 0,
        ModuleStartDate: null,
        ModuleEndDate: null,
        ModuleDueDate: null,
        IsLocked: false,
        Description: {
          Text: "Temporary module for image insertion.",
          Html: "<p>Temporary module for image insertion.</p>",
        },
        Duration: null,
      },
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    moduleId = moduleResponse.data.Id;
    console.log(
      `Successfully created temporary top-level module with ID: ${moduleId}`
    );
    // --- Step 2: Fetch image as a buffer and define the D2L URL ---
    const { buffer, contentType } = await fetchImageBuffer(decodedImageUrl);
    const fileExt = contentType.split("/").pop();
    let baseName = imageId || `img_${Date.now()}`;
    baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${baseName}.${fileExt}`;
    const d2lPath = `/content/enforced/${orgUnitId}-${orgId}/${fileName}`;
    console.log(`Fetched image and will store at D2l path: ${d2lPath}`);
    // --- Step 3: Create topic and upload image in a single multipart/mixed request ---
    const boundary = `--------------------------${Date.now().toString(16)}`;
    const topicPayload = {
      Title: `Temp Image Topic - ${Date.now()}`,
      ShortTitle: `ImgTopic${Date.now()}`,
      Type: 1,
      TopicType: 1,
      Url: d2lPath,
      StartDate: null,
      EndDate: null,
      DueDate: null,
      IsHidden: false,
      IsLocked: false,
      OpenAsExternalResource: false,
      Description: {
        Content: "Temporary topic for image insertion.",
        Type: "Html",
      },
      MajorUpdate: null,
      MajorUpdateText: null,
      ResetCompletionTracking: null,
    };
    const bodyHeader = `--${boundary}\r\nContent-Disposition: form-data; name="topicData"\r\nContent-Type: application/json\r\n\r\n`;
    const bodyJSON = JSON.stringify(topicPayload);
    const bodyDivider = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`;
    const bodyFooter = `\r\n--${boundary}--`;
    const requestBody = Buffer.concat([
      Buffer.from(bodyHeader),
      Buffer.from(bodyJSON),
      Buffer.from(bodyDivider),
      buffer,
      Buffer.from(bodyFooter),
    ]);
    const topicResp = await axios.post(
      `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/${moduleId}/structure/`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${d2lAccessToken}`,
          "Content-Type": `multipart/mixed; boundary=${boundary}`,
          "Content-Length": requestBody.length,
        },
      }
    );
    topicId = topicResp.data?.TopicId || topicResp.data?.Id;
    const d2lImageUrl = topicResp.data?.Url;
    console.log(`Successfully created topic with ID: ${topicId}`);
    console.log(`Persistent D2L Image URL is: ${d2lImageUrl}`);
    // --- Step 4: HTML output and Deep Linking ---
    let htmlAttrs = `height="500px" src="${d2lImageUrl}" title="${title}"`;
    if (decorative === "true") {
      htmlAttrs += ' role="presentation" alt=""';
    } else {
      htmlAttrs += ` alt="${altText}"`;
    }
    const finalHtmlFragment = `
    <img ${htmlAttrs}>`;
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
    const formHtml = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "Image inserted successfully into D2L!" }
    );
    console.log("Deep Link Items Sent.");
    return formHtml ? res.send(formHtml) : res.sendStatus(500);
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
    return handleError(
      res,
      500,
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
};

module.exports = {
  publicInsertController,
};
