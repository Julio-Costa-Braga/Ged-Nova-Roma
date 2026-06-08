// Tests — backend/utils/auth.js
// Executa com: node --test tests/unit/auth.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

// Stub bcrypt para não precisar instalar em CI (testa a lógica, não o bcrypt)
// Em ambiente real, o bcrypt real é usado — o stub só isola a unidade.
const authModule = require('../../backend/utils/auth');

describe('hashPassword', () => {
  it('retorna uma string não vazia', async () => {
    const hash = await authModule.hashPassword('minhaSenha123');
    assert.ok(typeof hash === 'string' && hash.length > 0, 'hash deve ser string não vazia');
  });

  it('hashes diferentes para senhas diferentes', async () => {
    const h1 = await authModule.hashPassword('senhaA');
    const h2 = await authModule.hashPassword('senhaB');
    assert.notEqual(h1, h2, 'hashes de senhas distintas devem diferir');
  });

  it('não retorna a senha em texto plano', async () => {
    const senha = 'senha-secreta';
    const hash  = await authModule.hashPassword(senha);
    assert.ok(!hash.includes(senha), 'hash não deve conter a senha em texto plano');
  });
});

describe('verifyPassword', () => {
  it('retorna true para senha correta', async () => {
    const hash = await authModule.hashPassword('correta123');
    const ok   = await authModule.verifyPassword('correta123', hash);
    assert.equal(ok, true);
  });

  it('retorna false para senha errada', async () => {
    const hash = await authModule.hashPassword('correta123');
    const ok   = await authModule.verifyPassword('errada456', hash);
    assert.equal(ok, false);
  });
});

describe('sanitizeUser', () => {
  it('remove o campo senha do retorno', () => {
    const raw = { id: 1, nome: 'João', username: 'joao', senha: 'hash-secreto', acesso: 'ambos', created_at: new Date() };
    const clean = authModule.sanitizeUser(raw);
    assert.ok(!('senha' in clean), 'sanitizeUser não deve expor o campo senha');
  });

  it('retorna null para entrada null', () => {
    assert.equal(authModule.sanitizeUser(null), null);
  });

  it('mapeia acesso para role corretamente', () => {
    const cases = [
      { acesso: 'ambos',            role: 'administrador' },
      { acesso: 'financeiro',       role: 'financeiro' },
      { acesso: 'rh',               role: 'rh' },
      { acesso: 'apenas-observador', role: 'observador' }
    ];
    for (const { acesso, role } of cases) {
      const user = authModule.sanitizeUser({ id: 1, nome: 'T', username: 'T', acesso, created_at: new Date() });
      assert.equal(user.role, role, `acesso "${acesso}" deve mapear para role "${role}"`);
    }
  });

  it('readOnly true apenas para observador', () => {
    const obs = authModule.sanitizeUser({ id: 1, nome: 'T', username: 'T', acesso: 'apenas-observador', created_at: new Date() });
    const adm = authModule.sanitizeUser({ id: 2, nome: 'T', username: 'T', acesso: 'ambos', created_at: new Date() });
    assert.equal(obs.readOnly, true);
    assert.equal(adm.readOnly, false);
  });
});
