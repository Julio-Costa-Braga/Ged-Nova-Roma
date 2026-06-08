const express = require('express');
const { authenticateUser } = require('../services/userService');
const { generateToken, requireAuth } = require('../middleware/auth');
const { authLimiter, logAudit, createAuditLog } = require('../middleware/security');

const router = express.Router();

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validação mínima
    if (!identifier || typeof identifier !== 'string' ||
        !password   || typeof password   !== 'string') {
      return res.status(400).json({ error: 'identifier e password são obrigatórios.' });
    }

    const user = await authenticateUser(identifier.trim(), password);
    if (!user) {
      // Log tentativa falha
      logAudit(createAuditLog('login_failed', 'unknown', 'auth', {
        identifier: identifier.substring(0, 3) + '***',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }));
      
      // Mensagem genérica para não vazar se o usuário existe
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = generateToken(user);
    
    // Log login bem-sucedido
    logAudit(createAuditLog('login_success', user.id, 'auth', {
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }));
    
    return res.json({ token, user });
  } catch (error) {
    console.error('Auth error:', error.message);
    logAudit(createAuditLog('login_error', 'unknown', 'auth', {
      error: error.message,
      ipAddress: req.ip
    }));
    return res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
});

// GET /api/auth/me — retorna dados do usuário logado (valida token)
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
