const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function isLegacySha256(hash) {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash);
}

function sha256(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

async function verifyPassword(plain, storedHash) {
  if (isLegacySha256(storedHash)) {
    const valid = sha256(plain) === storedHash;
    return { valid, needsMigration: valid };
  }
  const valid = await bcrypt.compare(plain, storedHash);
  return { valid, needsMigration: false };
}

function getDefaultModules(access) {
  const all = { ged: true, rh: true, financeiro: true, gestao: true };
  if (!access || access === 'ambos')       return all;
  if (access === 'financeiro')             return { ged: true, rh: false, financeiro: true,  gestao: false };
  if (access === 'rh')                     return { ged: true, rh: true,  financeiro: false, gestao: false };
  if (access === 'apenas-observador')      return all;
  return all;
}

function normalizeUserModules(user) {
  if (!user) return user;
  const modules  = getDefaultModules(user.acesso || user.access);
  const readOnly = user.acesso === 'apenas-observador' || user.access === 'apenas-observador';
  return { ...user, modules, readOnly: Boolean(readOnly) };
}

function getUserRole(access) {
  if (access === 'ambos')             return 'administrador';
  if (access === 'financeiro')        return 'financeiro';
  if (access === 'rh')                return 'rh';
  if (access === 'apenas-observador') return 'observador';
  return 'usuario';
}

function sanitizeUser(user) {
  if (!user) return null;
  const normalized = normalizeUserModules(user);
  return {
    id:         user.id,
    name:       user.nome || user.name || '',
    username:   user.username,
    access:     user.acesso || user.access,
    role:       getUserRole(user.acesso || user.access),
    modules:    normalized.modules,
    readOnly:   normalized.readOnly,
    mustChangePassword: Boolean(user.must_change_password || user.mustChangePassword || false),
    created_at: user.created_at
  };
}

module.exports = { hashPassword, verifyPassword, isLegacySha256, normalizeUserModules, sanitizeUser };