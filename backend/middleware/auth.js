const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Garante que a variável de ambiente existe antes de iniciar
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido em .env — configure antes de iniciar o servidor.');
}

// ─── Geração ─────────────────────────────────────────────────────────────────

/**
 * Gera um token JWT com payload do usuário.
 * Validade padrão: 8 horas (jornada de trabalho).
 */
function generateToken(user) {
  return jwt.sign(
    {
      sub:      user.id,
      username: user.username,
      access:   user.access,
      role:     user.role
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ─── Verificação (middleware Express) ────────────────────────────────────────

/**
 * Middleware que exige token JWT válido no header Authorization.
 * Injeta req.user = { id, username, access, role } para uso nas rotas.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id:       payload.sub,
      username: payload.username,
      access:   payload.access,
      role:     payload.role
    };
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expirado. Faça login novamente.'
      : 'Token inválido.';
    return res.status(401).json({ error: message });
  }
}

// ─── Autorização por perfil ───────────────────────────────────────────────────

/**
 * Middleware que restringe acesso a determinados perfis.
 * Uso: requireRole('administrador', 'financeiro')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Perfis permitidos: ${roles.join(', ')}.`
      });
    }
    return next();
  };
}

module.exports = { generateToken, requireAuth, requireRole };
