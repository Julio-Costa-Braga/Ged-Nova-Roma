// Tests — backend/middleware/auth.js
// Executa com: node --test tests/unit/middleware.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

// Configura JWT_SECRET antes de importar o módulo
process.env.JWT_SECRET = 'test-secret-para-testes-unitarios-apenas';

const { generateToken, requireAuth, requireRole } = require('../../backend/middleware/auth');

const fakeUser = { id: 1, username: 'admin', access: 'ambos', role: 'administrador' };

function mockRes() {
  const res = {};
  res.status = (code) => { res._status = code; return res; };
  res.json   = (body)  => { res._body   = body;  return res; };
  return res;
}

describe('generateToken', () => {
  it('retorna uma string JWT', () => {
    const token = generateToken(fakeUser);
    assert.ok(typeof token === 'string');
    assert.ok(token.split('.').length === 3, 'JWT deve ter 3 partes separadas por ponto');
  });
});

describe('requireAuth', () => {
  it('retorna 401 sem header Authorization', () => {
    const req = { headers: {} };
    const res = mockRes();
    requireAuth(req, res, () => {});
    assert.equal(res._status, 401);
  });

  it('retorna 401 com token inválido', () => {
    const req = { headers: { authorization: 'Bearer token-invalido' } };
    const res = mockRes();
    requireAuth(req, res, () => {});
    assert.equal(res._status, 401);
  });

  it('injeta req.user e chama next() com token válido', () => {
    const token = generateToken(fakeUser);
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    let nextCalled = false;
    requireAuth(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled, 'next() deve ser chamado com token válido');
    assert.equal(req.user.username, 'admin');
    assert.equal(req.user.role, 'administrador');
  });
});

describe('requireRole', () => {
  it('retorna 403 para role não autorizado', () => {
    const req = { user: { role: 'observador' } };
    const res = mockRes();
    requireRole('administrador')(req, res, () => {});
    assert.equal(res._status, 403);
  });

  it('chama next() para role autorizado', () => {
    const req = { user: { role: 'administrador' } };
    const res = mockRes();
    let ok = false;
    requireRole('administrador', 'financeiro')(req, res, () => { ok = true; });
    assert.ok(ok);
  });
});
