const asyncHandler = require("express-async-handler");
const lti = require("ltijs").Provider;
const axios = require("axios");
const {
  fetchImageBuffer,
  hasAllowedRole,
  unflatten,
  getUserId,
  getOrRenewToken,
  ALLOWED_ROLES,
  normalizeRole,
  logDecodedJwt,
  HttpError,
} = require("../utils");
const imageModel = require("../model/image.model");
const organizationModel = require("../model/organization.model");
const { getRefreshedD2LToken } = require("./oauth.controller");

const publicInsertController = asyncHandler(async (req, res) => {
  let moduleId, topicId;
  const orgUnitId = res.locals.context.context?.id;
  const orgLabel = res.locals.context.context?.label;
  const userId = getUserId(req, res);

  const d2lAccessToken = await getOrRenewToken({
    userId,
    provider: "d2l",
    getNewTokenFn: async () => null,
    getRefreshTokenFn: getRefreshedD2LToken,
  });

  if (!d2lAccessToken) {
    throw new HttpError(
      401,
      "D2L Access Token missing or expired. Please complete the OAuth login process first."
    );
  }

  const finalImageData = unflatten(req.body);
  const { searchTerm } = req.query;

  if (!finalImageData?.SystemIdentifier) {
    throw new HttpError(400, "Missing SystemIdentifier in request body.");
  }

  const { SystemIdentifier, altText, isDecorative } = finalImageData;

  const availableOrgId = await organizationModel.findOneAndUpdate(
    { organizationId: orgUnitId },
    { organizationId: orgUnitId },
    { upsert: true, new: true }
  );

  const cachedImage = await imageModel.findOne({
    SystemIdentifier,
    organization: availableOrgId?._id,
  });

  const isDecorativeFlag =
    isDecorative === true ||
    (typeof isDecorative === "string" && isDecorative.toLowerCase() === "true");

  // ---------------------
  // If cached — use that
  // ---------------------
  if (cachedImage) {
    if (searchTerm) {
      const cleanKeyword = searchTerm.trim().toLowerCase();
      if (!cachedImage.keywords.includes(cleanKeyword)) {
        cachedImage.keywords.push(cleanKeyword);
        await cachedImage.save();
      }
    }

    const d2lImageUrl = cachedImage.d2lImageUrl;
    let htmlAttrs = `height="auto" width="650px" src="${d2lImageUrl}"`;

    if (isDecorativeFlag) {
      htmlAttrs += ' alt="" role="presentation" ';
    } else {
      htmlAttrs += ` alt="${altText || ""}" `;
    }

    const finalHtmlFragment = `<img ${htmlAttrs}>`;

    const items = [
      {
        type: "html",
        html: finalHtmlFragment,
        title: cachedImage?.Title,
        text: cachedImage?.Title,
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

    return res.send(formHtml);
  }

  // ---------------------
  // Else — upload to D2L
  // ---------------------
  const decodedImageUrl = decodeURIComponent(
    finalImageData.Path_TR1?.URI || finalImageData.Path_TR7?.URI || ""
  );

  if (!orgUnitId) {
    throw new HttpError(
      401,
      "LTI context missing. Please launch the tool from D2L."
    );
  }

  let organization = await organizationModel.findOne({
    organizationId: orgUnitId,
  });

  if (!organization) {
    organization = await organizationModel.create({
      organizationId: orgUnitId,
    });
  }

  // Step 1: Create a Temporary Module (Top-Level)
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

  // Step 2: Fetch image as a buffer and define the D2L URL
  const { buffer, contentType } = await fetchImageBuffer(decodedImageUrl);
  const fileExt = contentType.split("/").pop();
  let baseName = SystemIdentifier || `img_${Date.now()}`;
  baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const fileName = `${baseName}.${fileExt}`;
  const d2lPath = orgLabel
    ? `/content/enforced/${orgUnitId}-${orgLabel}/${fileName}`
    : `/content/enforced/${orgUnitId}/${fileName}`;

  // Step 3: Create topic and upload image in a single multipart/mixed request
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
  const d2lFullImageUrl = process.env.PLATFORM_URL + d2lImageUrl;

  // Step 4: Insert into D2L via Deep Linking
  let htmlAttrs = `height="auto" width="650px" src="${d2lImageUrl}"`;
  if (isDecorativeFlag) {
    htmlAttrs += ' alt="" role="presentation" ';
  } else {
    htmlAttrs += ` alt="${altText || ""}" `;
  }
  const finalHtmlFragment = `<img ${htmlAttrs}>`;

  const items = [
    {
      type: "html",
      html: finalHtmlFragment,
      title: finalImageData.Title || "",
      text: finalImageData.Title || "",
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
  if (process.env.LOG_VERBOSE === "1") {
    console.log("Organization ID:", organization?._id);
  }

  // Step 5: Cache in MongoDB
  const sanitizedData = Object.fromEntries(
    Object.entries(finalImageData || {}).filter(([key]) => !key.includes("."))
  );

  const rightsSituationRaw =
    finalImageData?.["MAY.Digital-Rights-Situation"] ??
    finalImageData?.MAY?.["Digital-Rights-Situation"];
  const rightsTypeRaw =
    finalImageData?.["MAY.Copyright-Type"] ??
    finalImageData?.MAY?.["Copyright-Type"];
  const rightsHolderRaw =
    finalImageData?.["MAY.Copyright-Holder"] ??
    finalImageData?.MAY?.["Copyright-Holder"];

  const rightsSituation =
    typeof rightsSituationRaw === "object" && rightsSituationRaw
      ? rightsSituationRaw.Value || rightsSituationRaw.KeywordText || ""
      : rightsSituationRaw || "";
  const rightsType =
    typeof rightsTypeRaw === "object" && rightsTypeRaw
      ? rightsTypeRaw.Value || rightsTypeRaw.KeywordText || ""
      : rightsTypeRaw || "";
  const rightsHolder = rightsHolderRaw || "";

  await imageModel.findOneAndUpdate(
    { SystemIdentifier, organization: organization._id },
    {
      $set: {
        ...sanitizedData,
        MayoDigitalRightsSituation:
          rightsSituation || sanitizedData.MayoDigitalRightsSituation,
        MayoCopyrightHolder: rightsHolder || sanitizedData.MayoCopyrightHolder,
        MayoCopyrightType: rightsType || sanitizedData.MayoCopyrightType,
        d2lImageUrl,
        d2lFullImageUrl,
        organization: organization._id,
        altText: altText || "",
        isDecorative: isDecorativeFlag,
        keywords: (searchTerm || "")
          .split(",")
          .map((k) => k?.trim())
          .filter(Boolean),
      },
    },
    { upsert: true, new: true }
  );
  if (process.env.LOG_VERBOSE === "1") {
    console.log(
      `Image with ID ${SystemIdentifier} cached in MongoDB (upserted).`
    );
  }
  res.send(formHtml);

  // Step 6: Cleanup temp module/topic
  try {
    if (topicId) {
      await axios.delete(
        `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/topics/${topicId}`,
        { headers: { Authorization: `Bearer ${d2lAccessToken}` } }
      );
      if (process.env.LOG_VERBOSE === "1") {
        console.log(`Successfully deleted temporary topic ${topicId}.`);
      }
    }
    if (moduleId) {
      await axios.delete(
        `${process.env.D2L_API_BASE_URL}/${orgUnitId}/content/modules/${moduleId}`,
        { headers: { Authorization: `Bearer ${d2lAccessToken}` } }
      );
    }
    if (process.env.LOG_VERBOSE === "1") {
      console.log(`Successfully deleted temporary module ${moduleId}.`);
    }
  } catch (cleanupErr) {
    console.warn("Cleanup failed:", cleanupErr.message);
  }
});

const publicRolesController = asyncHandler(async (req, res) => {
  const userRoles = res.locals.context?.roles || [];
  const normalizedRoles = userRoles.map(normalizeRole);
  const isAllowed = hasAllowedRole(normalizedRoles);

  res.json({
    roles: userRoles,
    normalizedRoles,
    isAllowed,
    allowedRoles: ALLOWED_ROLES,
  });
});

const publicSearchDBController = asyncHandler(async (req, res) => {
  const organizationId = res.locals.context?.context?.id;
  const { query } = req.query;
  console.log(
    "Searching images for organization:",
    organizationId,
    "Query:",
    query
  );

  if (!query?.trim()) {
    throw new HttpError(400, "Search query is required.");
  }
  const disallowedPattern = /[^\p{L}\p{N}\s\.]/u;
  if (disallowedPattern.test(String(query))) {
    throw new HttpError(
      400,
      "Please remove invalid characters to continue the search."
    );
  }

  const organization = await organizationModel.findOneAndUpdate(
    { organizationId },
    { organizationId },
    { upsert: true, new: true }
  );

  const searchRegex = new RegExp(query, "i");
  const results = await imageModel
    .find({
      organization: organization._id,
      $or: [
        { Title: searchRegex },
        { altText: searchRegex },
        { keywords: searchRegex },
      ],
    })
    .limit(100);

  res.json(results);
});

module.exports = {
  publicInsertController,
  publicRolesController,
  publicSearchDBController,
};
