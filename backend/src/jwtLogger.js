const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function logDecodedJwt(label, token, type = "general") {
  const logsDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  const logFileName =
    type === "request"
      ? "deeplinkRequest.log"
      : type === "response"
      ? "deeplinkResponse.log"
      : "deeplink.log";

  const logFilePath = path.join(logsDir, logFileName);

  let logEntry = `\n=== ${label} ===\nTime: ${new Date().toISOString()}\n`;

  if (type === "response" && typeof token === "string") {
    try {
      const decoded = jwt.decode(token, { complete: true });
      logEntry += `Header: ${JSON.stringify(decoded?.header || {}, null, 2)}\n`;
      logEntry += `Payload: ${JSON.stringify(
        decoded?.payload || {},
        null,
        2
      )}\n`;
    } catch (err) {
      logEntry += `Error decoding JWT: ${err.message}\n`;
    }
  } else {
    logEntry += `Payload: ${JSON.stringify(token, null, 2)}\n`;
  }

  logEntry += "=========================\n";

  fs.writeFileSync(logFilePath, logEntry, "utf8");
}

module.exports = { logDecodedJwt };
