const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  MONGODB_URI: process.env.MONGODB_URI || "",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "sheet-webapp",
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:3000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: process.env.SMTP_PORT || "",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "",
};

if (!env.DATABASE_URL && !env.MONGODB_URI) {
  throw new Error(
    "Missing database configuration. Set DATABASE_URL or MONGODB_URI.",
  );
}

export default env;
