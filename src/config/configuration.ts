export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'syborx_jwt_secret_dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'syborx_refresh_secret_dev',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  uploads: {
    dest: process.env.UPLOAD_DEST || './uploads',
    maxSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 25) * 1024 * 1024,
  },
  corporate: {
    allowedDomain: process.env.ALLOWED_CORP_DOMAIN || 'syborx.com',
    allowGmailTesting: process.env.ALLOW_GMAIL_TESTING === 'true',
  },
});
