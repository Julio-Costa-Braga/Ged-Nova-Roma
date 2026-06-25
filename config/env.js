const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente de arquivos locais e de produção
// Em Vercel, se o arquivo .env.production estiver presente no deploy, ele também será usado.
const envFiles = ['.env.local', '.env', '.env.production'];
for (const filename of envFiles) {
  const filepath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filepath)) continue;
  dotenv.config({ path: filepath });
}

const trimTrailingSlash = value => value.trim().replace(/\/+$/, '');
const parseCsv = value => {
  return value
    .split(',')
    .map(item => trimTrailingSlash(item.trim()))
    .filter(Boolean);
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  BASE_PATH: process.env.BASE_PATH || '',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? parseCsv(process.env.ALLOWED_ORIGINS) : [],
  MAIL_PROVIDER: process.env.MAIL_PROVIDER || '',
  MAIL_API_KEY: process.env.MAIL_API_KEY || '',
  MAIL_FROM: process.env.MAIL_FROM || ''
};

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
const missingVars = REQUIRED_ENV.filter(key => !env[key]);
if (missingVars.length > 0) {
  console.error(
    `ERRO: variável(s) de ambiente obrigatória(s) não definidas: ${missingVars.join(', ')}\n` +
    'Local: Verifique .env.local ou .env.production\n' +
    'Vercel: Configure via https://vercel.com/[projeto]/settings/environment-variables'
  );
  process.exit(1);
}

module.exports = env;
