const lti = require("ltijs").Provider;
const axios = require("axios");
const {
  fetchImageBuffer,
  handleError,
  hasAllowedRole,
} = require("../utils/common.utils");
const { logDecodedJwt } = require("../jwtLogger");
const imageModel = require("../model/image.model");
const organizationModel = require("../model/organization.model");

const publicInsertController = async (req, res) => {
  let moduleId, topicId;
  let orgUnitId;
  try {
    const { imageUrl, title, altText, imageId, isDecorative } = req.body;
    const { searchTerm } = req.query;

    if (!imageId) {
      return handleError(res, 400, "Missing imageId in request body.");
    }

    // --- Check MongoDB cache first ---
    console.log(res.locals.context.context.id, "=====================");
    const findOr = await organizationModel.findOne({
      orgId: res.locals.context.context.id,
    });

    const cached = await imageModel.findOne({
      imageId,
      organization: findOr._id,
    });

    console.log("Cached Image:", cached);

    if (cached) {
      // Scenario 1: Image already exists in MongoDB
      console.log(`Image with ID ${imageId} ${findOr?.orgId}found in cache.`);

      if (searchTerm) {
        const cleanKeyword = altText.trim().toLowerCase();
        if (!cached.keywords.includes(cleanKeyword)) {
          cached.keywords.push(cleanKeyword);
          await cached.save();
          console.log(
            `Added new keyword "${cleanKeyword}" to imageId ${imageId}`
          );
        }
      }

      const d2lImageUrl = cached.d2lImageUrl;
      let htmlAttrs = `height="auto" width="650px" src="${d2lImageUrl}"`;
      const isDecorativeFlag =
        isDecorative === true ||
        (typeof isDecorative === "string" &&
          isDecorative.toLowerCase() === "true");

      if (isDecorativeFlag) {
        htmlAttrs += 'alt="" role="presentation"';
      } else {
        htmlAttrs += `alt="${altText || ""}"`;
      }
      const finalHtmlFragment = `
      <img ${htmlAttrs}>`;

      const items = [
        {
          type: "html",
          html: finalHtmlFragment,
          title: title,
          text: title,
        },
      ];

      const jwt = await lti.DeepLinking.createDeepLinkingMessage(
        res.locals.token,
        items,
        {
          message: "Successfully registered resource!",
        }
      );

      logDecodedJwt("Deep Linking Response", jwt, "response");

      const formHtml = await lti.DeepLinking.createDeepLinkingForm(
        res.locals.token,
        items,
        { message: "Image inserted successfully into D2L!" }
      );
      return formHtml ? res.send(formHtml) : res.sendStatus(500);
    }

    const decodedImageUrl = decodeURIComponent(imageUrl);
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

    let organization = await organizationModel.findOne({ orgId: orgUnitId });
    console.log("Organization found or created:", organization);

    if (!organization) {
      console.log("try");

      organization = await organizationModel.create({ orgUnitId });
    }

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

    // --- Step 2: Fetch image as a buffer and define the D2L URL ---
    const { buffer, contentType } = await fetchImageBuffer(decodedImageUrl);
    const fileExt = contentType.split("/").pop();
    let baseName = imageId || `img_${Date.now()}`;
    baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${baseName}.${fileExt}`;
    const d2lPath = `/content/enforced/${orgUnitId}-${orgId}/${fileName}`;

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

    console.log(
      `Persistent D2L complete image URL: ${
        process.env.PLATFORM_URL + d2lImageUrl
      }`
    );

    // --- Step 4: HTML output and Deep Linking ---
    let htmlAttrs = `height="auto" width="650px" src="${d2lImageUrl}"`;
    const isDecorativeFlag =
      isDecorative === true ||
      (typeof isDecorative === "string" &&
        isDecorative.toLowerCase() === "true");

    if (isDecorativeFlag) {
      htmlAttrs += ' alt="" role="presentation" ';
    } else {
      htmlAttrs += ` alt="${altText || ""}" `;
    }
    const finalHtmlFragment = `
    <img ${htmlAttrs}>`;
    console.log("[DEBUG] Final HTML fragment to insert:", finalHtmlFragment);

    const items = [
      {
        type: "html",
        html: finalHtmlFragment,
        title: title,
        text: title,
      },
    ];
    console.log("Creating Deep Linking Form...");

    const jwt = await lti.DeepLinking.createDeepLinkingMessage(
      res.locals.token,
      items,
      {
        message: "Successfully registered resource!",
      }
    );

    logDecodedJwt("Deep Linking Response", jwt, "response");

    const formHtml = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "Image inserted successfully into D2L!" }
    );
    console.log("Deep Link Items Sent.");
    // After successful upload to D2L, save to MongoDB:
    // await imageModel.create({
    //   imageId,
    //   mayoUrl: imageUrl,
    //   d2lImageUrl: d2lImageUrl,
    // });
    console.log("Organization ID:", organization._id);

    await imageModel.create({
      imageId,
      mayoUrl: imageUrl,
      d2lImageUrl: d2lImageUrl,
      organization: organization._id,
      altText: altText ? altText : "",
      isDecorative: isDecorativeFlag ? isDecorativeFlag : false,
      title: title ? title : "",
      keywords: searchTerm.split(",").map((k) => k.trim()),
    });
    console.log(`Image with ID ${imageId} cached in MongoDB.`);

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

const rolesString = process.env.ALLOWED_ROLES || "";

const ALLOWED_ROLES = rolesString
  .split(",")
  .map((role) => role.trim())
  .filter((role) => role);

const publicRolesController = async (req, res) => {
  const userRoles = res.locals.context?.roles || [];
  const isAllowed = hasAllowedRole(userRoles);

  res.json({
    roles: userRoles,
    isAllowed: isAllowed,
    allowedRoles: ALLOWED_ROLES,
  });
};

const publicSearchDBController = async (req, res) => {
  const orgId = res.locals.context.context.id;
  const { query } = req.query;
  console.log("Search query received:", req?.query);
  console.log("Searching images for organization:", orgId, "Query:", query);

  if (!query?.trim()) {
    return res.status(400).json({ error: "Search query is required." });
  }

  // 1. Find organization document by orgId
  const organization = await organizationModel.findOne({ orgId });
  if (!organization) {
    return res.status(404).json({ error: "Organization not found." });
  }

  // 2. Prepare search regex (case-insensitive)
  const searchRegex = new RegExp(query, "i");

  // 3. Search in `title`, `altText`, and `keywords` array only
  const results = await imageModel.find({
    organization: organization._id,
    $or: [
      { title: searchRegex },
      { altText: searchRegex },
      { keywords: { $in: [searchRegex] } }, // Match any item in array
    ],
  });

  res.json(results);
};

module.exports = {
  publicInsertController,
  publicRolesController,
  publicSearchDBController,
};
