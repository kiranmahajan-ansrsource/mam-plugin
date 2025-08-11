const requiredEnv = [
  "LTI_KEY",
  "MONGODB_URI",
  "PLATFORM_URL",
  "CLIENT_ID",
  "AUTH_URL",
  "TOKEN_URL",
  "KEYSET_URL",
  "MAYO_BASE_URL",
  "MAYO_AUTH_URL",
  "MAYO_IMG_SEARCH_URL",
  "MAYO_CLIENT_ID",
  "MAYO_CLIENT_SECRET",
  "D2L_OAUTH_CLIENT_ID",
  "D2L_OAUTH_CLIENT_SECRET",
  "D2L_OAUTH_REDIRECT_URI",
  "D2L_OAUTH_URL",
  "D2L_OAUTH_TOKEN_URL",
  "D2L_API_BASE_URL",
  "ALLOWED_ROLES",
];

const validateEnv = () => {
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};

module.exports = { validateEnv, requiredEnv };
