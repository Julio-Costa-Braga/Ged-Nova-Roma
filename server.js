const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const config = require('./config');

// ─── Security Middleware ──────────────────────────────────────────────────────
const {
  apiLimiter, securityHeaders, 
  logAudit, createAuditLog
} = require('./backend/middleware/security');

const BASE_PATH = config.BASE_PATH;
const API_PATH = config.API_PATH;

// ─── Rotas ───────────────────────────────────────────────────────────────────
const authRoutes    = require('./backend/routes/auth');
const usersRoutes   = require('./backend/routes/users');
const rhRoutes      = require('./backend/routes/rh');
const gedRoutes     = require('./backend/routes/ged');
const financeRoutes = require('./backend/routes/finance');

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(securityHeaders);

// ─── #6 CORS restrito ─────────────────────────────────────────────────────────
// ALLOWED_ORIGINS no .env: origens separadas por vírgula
// Ex.: ALLOWED_ORIGINS=http://localhost:3000,https://ged.novaroma.com.br
const allowedOrigins = config.ALLOWED_ORIGINS;

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (ex.: curl, Postman, SSR)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin bloqueada pelo CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Logging de requisições ────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (req.path.startsWith(API_PATH)) {
      console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ─── API routes (devem vir ANTES do static + fallback SPA) ───────────────────
// #9 CORRIGIDO: a ordem anterior registrava o fallback SPA antes das rotas /api,
// o que fazia o Express servir index.html para qualquer rota desconhecida,
// incluindo erros de API. Agora a sequência é: API → static → SPA fallback.

if (BASE_PATH) {
  app.get('/', (req, res) => {
    return res.redirect(`${BASE_PATH}/`);
  });
}

app.get(`${API_PATH}/health`, (req, res) => {
  res.json({ status: 'ok', service: 'GED Backend', timestamp: new Date().toISOString() });
});

app.use(`${API_PATH}/auth`,    authRoutes);
app.use(`${API_PATH}/users`,   usersRoutes);
app.use(`${API_PATH}/rh`,      rhRoutes);
app.use(`${API_PATH}/ged`,     gedRoutes);
app.use(`${API_PATH}/finance`, financeRoutes);

// 404 explícito para rotas /api/* não encontradas (antes do static)
app.use(`${API_PATH}`, (req, res) => {
  res.status(404).json({ error: 'Rota de API não encontrada.' });
});

// ─── Frontend estático ────────────────────────────────────────────────────────
const frontendDir = path.join(__dirname, 'frontend');
if (fs.existsSync(frontendDir)) {
  app.use(BASE_PATH, express.static(frontendDir, {
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      if (filepath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
  }));

  if (BASE_PATH) {
    app.get(BASE_PATH, (req, res) => {
      return res.sendFile(path.join(frontendDir, 'index.html'));
    });
  }

  app.get(`${BASE_PATH}/*`, (req, res) => {
    let relativePath = req.path;
    if (BASE_PATH && relativePath.startsWith(BASE_PATH)) {
      relativePath = relativePath.slice(BASE_PATH.length);
    }
    if (!relativePath || relativePath === '/') {
      relativePath = '/index.html';
    }

    const filePath = path.join(frontendDir, relativePath);
    if (req.path.endsWith('.html') && fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    } else if (!req.path.includes('.')) {
      return res.sendFile(path.join(frontendDir, 'index.html'));
    } else {
      return res.status(404).send('Not Found');
    }
  });
}

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('Origin bloqueada')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Internal error:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Servidor GED iniciado em http://localhost:${PORT}`);
  console.log(`CORS permitido para: ${allowedOrigins.join(', ')}`);
});
