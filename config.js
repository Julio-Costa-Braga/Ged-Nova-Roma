const env = require('./config/env');

const normalizedBasePath = env.BASE_PATH ? `/${env.BASE_PATH.replace(/^\/+|\/+$/g, '')}` : '';

module.exports = {
  ...env,
  BASE_PATH: normalizedBasePath,
  API_PATH: `${normalizedBasePath}/api`,
  PORT: Number(env.PORT) || 3000,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS
};
