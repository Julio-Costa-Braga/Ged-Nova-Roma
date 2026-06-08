// Teste Rápido de Segurança
const assert = require('assert');
const path = require('path');
const security = require(path.join(__dirname, '../backend/middleware/security'));

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  TESTES DE SEGURANÇA - BACKEND');
console.log('═══════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Erro: ${e.message}`);
    failed++;
  }
}

// ─── Testes de Validação de Input ────────────────────────────────────────

console.log('📋 Validação de Input:\n');

test('Deve aceitar ID positivo válido', () => {
  const result = security.validatePositiveInteger('42', 'Test ID');
  assert.strictEqual(result, 42);
});

test('Deve rejeitar ID negativo', () => {
  try {
    security.validatePositiveInteger('-1', 'Test ID');
    throw new Error('Deveria ter rejeitado');
  } catch (e) {
    assert(e.message.includes('inválido'));
  }
});

test('Deve rejeitar ID não-inteiro', () => {
  try {
    security.validatePositiveInteger('abc', 'Test ID');
    throw new Error('Deveria ter rejeitado');
  } catch (e) {
    assert(e.message.includes('inválido'));
  }
});

test('Deve rejeitar ID zero', () => {
  try {
    security.validatePositiveInteger('0', 'Test ID');
    throw new Error('Deveria ter rejeitado');
  } catch (e) {
    assert(e.message.includes('inválido'));
  }
});

// ─── Testes de CSRF ─────────────────────────────────────────────────────

console.log('\n🛡️  CSRF Protection:\n');

test('Deve gerar CSRF token válido', () => {
  const token = security.generateCsrfToken();
  assert(token, 'Token gerado');
  assert.strictEqual(token.length, 64, 'Token tem 64 caracteres');
});

test('Deve validar CSRF token correto', () => {
  const token = security.generateCsrfToken();
  const isValid = security.validateCsrfToken(token, token);
  assert(isValid, 'CSRF token validado');
});

test('Deve rejeitar CSRF tokens diferentes', () => {
  const token1 = security.generateCsrfToken();
  const token2 = security.generateCsrfToken();
  const isValid = security.validateCsrfToken(token1, token2);
  assert(!isValid, 'CSRF tokens diferentes rejeitados');
});

test('Deve rejeitar CSRF token null', () => {
  const isValid = security.validateCsrfToken(null, null);
  assert(!isValid, 'CSRF null rejeitado');
});

// ─── Testes de Audit Logging ────────────────────────────────────────────

console.log('\n📝 Audit Logging:\n');

test('Deve criar log de auditoria com timestamp', () => {
  const log = security.createAuditLog('test_action', 123, 'test', { detail: 'teste' });
  assert(log.timestamp, 'Log tem timestamp');
  assert.strictEqual(log.action, 'test_action', 'Ação correta');
  assert.strictEqual(log.userId, 123, 'User ID correto');
  assert.strictEqual(log.resource, 'test', 'Resource correto');
});

test('Deve registrar e recuperar logs de auditoria', () => {
  const log = security.createAuditLog('login_test', 456, 'auth', {});
  security.logAudit(log);
  const logs = security.getAuditLogs({ userId: 456 });
  assert(logs.length > 0, 'Log foi registrado');
  assert.strictEqual(logs[logs.length - 1].userId, 456);
});

test('Deve filtrar logs por ação', () => {
  const log1 = security.createAuditLog('action_a', 1, 'res', {});
  const log2 = security.createAuditLog('action_b', 2, 'res', {});
  security.logAudit(log1);
  security.logAudit(log2);
  const filtered = security.getAuditLogs({ action: 'action_a' });
  assert(filtered.some(l => l.action === 'action_a'), 'Filtro por ação funciona');
});

// ─── Testes de String Sanitization ──────────────────────────────────────

console.log('\n🧹 String Sanitization:\n');

test('Deve sanitizar strings corretamente', () => {
  const result = security.sanitizeString('  hello world  ');
  assert.strictEqual(result, 'hello world');
});

test('Deve limitar tamanho de string', () => {
  const result = security.sanitizeString('abcdefghij', 5);
  assert.strictEqual(result, 'abcde');
});

test('Deve converter não-string para string vazia', () => {
  const result = security.sanitizeString(123);
  assert.strictEqual(result, '');
});

// ─── Testes de Rate Limiting ────────────────────────────────────────────

console.log('\n⏱️  Rate Limiting:\n');

test('Deve criar rate limiter function', () => {
  const limiter = security.createRateLimiter || true;
  assert(typeof security.authLimiter === 'function', 'Auth limiter é função');
  assert(typeof security.apiLimiter === 'function', 'API limiter é função');
});

// ─── Testes de Security Headers ─────────────────────────────────────────

console.log('\n🔒 Security Headers:\n');

test('Deve aplicar security headers', () => {
  const headers = {};
  const mockRes = {
    setHeader: (key, value) => { headers[key] = value; },
    status: () => ({ json: () => {} })
  };
  const mockReq = { path: '/api', method: 'GET' };
  
  security.securityHeaders(mockReq, mockRes, () => {});
  
  assert(headers['X-Content-Type-Options'] === 'nosniff');
  assert(headers['X-Frame-Options'] === 'DENY');
  assert(headers['X-XSS-Protection']);
  assert(headers['Content-Security-Policy']);
});

// ─── Testes de Error Handling ───────────────────────────────────────────

console.log('\n⚠️  Error Handling:\n');

test('Deve não expor stack trace em produção', () => {
  process.env.NODE_ENV = 'production';
  let errorResponse = null;
  
  const mockRes = {
    status: () => ({
      json: (data) => { errorResponse = data; }
    })
  };
  
  const mockReq = { path: '/api/test', method: 'GET' };
  const err = new Error('Erro interno');
  
  security.secureErrorHandler(err, mockReq, mockRes, () => {});
  
  assert(!errorResponse.error.includes('stack'), 'Stack não exposto');
  process.env.NODE_ENV = 'test';
});

// ─── Resumo ──────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULTADO: ${passed} ✓ | ${failed} ✗`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('✅ TODOS OS TESTES DE SEGURANÇA PASSARAM!\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} teste(s) falharam\n`);
  process.exit(1);
}
