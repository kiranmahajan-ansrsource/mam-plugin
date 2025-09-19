const axios = require("axios");

function errorHandler(err, req, res, next) {
  const isVerbose = process.env.LOG_VERBOSE === "1";

  let status = err.status || 500;
  let message = err.message || "An unexpected error occurred.";
  let details = undefined;

  function buildFullUrl(url, params) {
    try {
      if (!url) return undefined;
      const u = new URL(url);
      if (params && typeof params === "object") {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null) {
            u.searchParams.set(k, String(v));
          }
        }
      }
      return u.toString();
    } catch (_) {
      return url;
    }
  }

  function filterStack(stack) {
    if (!stack) return undefined;
    const lines = stack.split("\n");
    const appLines = lines.filter((l) => l.includes("backend/src/"));
    const head = lines.slice(0, 1);
    const axiosLine = lines.find((l) => l.includes("node_modules/axios"));
    const combined = [...head, ...(axiosLine ? [axiosLine] : []), ...appLines];
    return combined.join("\n");
  }

  if (axios.isAxiosError(err)) {
    status = err.response?.status || status;
    message = err.response?.data?.message || err.response?.data?.error || message;
    const baseDetails = {
      code: err.code,
      url: err.config?.url,
      method: err.config?.method,
      providerStatus: err.response?.status,
      providerText: err.response?.statusText,
    };

    const fullUrl = buildFullUrl(err.config?.url, err.config?.params);
    if (fullUrl) baseDetails.fullUrl = fullUrl;
    if (isVerbose) {
      baseDetails.params = err.config?.params;
      baseDetails.providerData = err.response?.data;
    }
    details = baseDetails;
  }

  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    status,
    message,
    ...(details ? { details } : {}),
    ...(isVerbose ? { stack: filterStack(err.stack) } : {}),
  };

  console.error(JSON.stringify(logPayload));

  res.status(status).json({
    error: true,
    message,
    ...(isVerbose && { stack: err.stack }),
  });
}

module.exports = errorHandler;
