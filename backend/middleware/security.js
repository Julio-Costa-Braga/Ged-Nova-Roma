// Middleware de segurança para Express (sem dependências externas adicionais)
const crypto = require('crypto');

// ─── Rate Limiting (In-Memory) ───────────────────────────────────────────────

const rateLimitStore = new Map();

function createRateLimiter(windowMs = 15 * 60 * 1000, maxRequests = 5) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();

    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    if (!record || now - record.startTime > windowMs) {
      // Nova janela
      rateLimitStore.set(key, { count: 1, startTime: now });
      return next();
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      return res.status(429).json({
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil((record.startTime + windowMs - now) / 1000)
      });
    }
    
    next();
  };
}

const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 tentativas em 15 min
const apiLimiter = createRateLimiter(60 * 1000, 100); // 100 requisições por minuto

// ─── Security Headers ───────────────────────────────────────────────────────

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: https:; connect-src 'self' https://xaitvyfplvbchygsejjv.supabase.co https://unpkg.com https://cdn.jsdelivr.net; frame-ancestors 'none';"
  );
  next();
}

// ─── CSRF Token Generation ──────────────────────────────────────────────────

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateCsrfToken(token, sessionToken) {
  if (!token || !sessionToken) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  } catch (e) {
    return false;
  }
}

// ─── Input Validation ───────────────────────────────────────────────────────

function validatePositiveInteger(value, fieldName = 'ID') {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${fieldName} inválido: deve ser um inteiro positivo.`);
  }
  return num;
}

function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.substring(0, maxLength).trim();
}

// ─── Audit Logger ───────────────────────────────────────────────────────────

function createAuditLog(action, userId, resource, details = {}) {
  return {
    timestamp: new Date().toISOString(),
    action, // 'create', 'update', 'delete', 'login', 'logout'
    userId: userId || 'anonymous',
    resource, // 'documento', 'usuario', 'auth'
    details,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown'
  };
}

// Simples audit log em memória (em produção usar database)
const auditLogs = [];

function logAudit(log) {
  auditLogs.push(log);
  console.log('[Audit]', JSON.stringify(log));
  
  // Manter apenas últimos 10.000 logs em memória
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }
}

function getAuditLogs(filters = {}) {
  let filtered = [...auditLogs];
  
  if (filters.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }
  if (filters.action) {
    filtered = filtered.filter(log => log.action === filters.action);
  }
  if (filters.resource) {
    filtered = filtered.filter(log => log.resource === filters.resource);
  }
  
  return filtered.slice(-100); // Últimos 100
}

// ─── Error Handler (seguro) ─────────────────────────────────────────────────

function secureErrorHandler(err, req, res, next) {
  console.error('[Error]', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Nunca expor stack trace em produção
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Erro no servidor. Tente novamente mais tarde.';

  res.status(statusCode).json({ error: message });
}

module.exports = {
  authLimiter,
  apiLimiter,
  securityHeaders,
  generateCsrfToken,
  validateCsrfToken,
  validatePositiveInteger,
  sanitizeString,
  createAuditLog,
  logAudit,
  getAuditLogs,
  secureErrorHandler
};
