const axios = require("axios");

function errorHandler(err, req, res, next) {
  console.error(`[${req.method}] ${req.originalUrl}`);
  console.error(err);

  let status = err.status || 500;
  let message = err.message || "An unexpected error occurred.";

  if (axios.isAxiosError(err)) {
    status = err.response?.status || status;
    message =
      err.response?.data?.message || err.response?.data?.error || message;

    console.error("Axios error details:", {
      code: err.code,
      url: err.config?.url,
      method: err.config?.method,
      data: err.response?.data,
    });
  }

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
