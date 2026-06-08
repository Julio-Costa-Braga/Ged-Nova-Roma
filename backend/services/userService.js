const supabase = require('../db/supabaseClient');
const { hashPassword, verifyPassword, sanitizeUser } = require('../utils/auth');

async function findUserByIdentifier(identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .or(`username.ilike.${trimmed},nome.ilike.${trimmed}`)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('usuarios').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? sanitizeUser(data) : null;
}

async function listUsers({ page = 1, limit = 50 } = {}) {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;
  const { data, error, count } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact' })
    .order('nome')
    .range(from, to);
  if (error) throw error;
  return {
    users: Array.isArray(data) ? data.map(sanitizeUser) : [],
    total: count ?? 0,
    page,
    limit
  };
}

async function createUser(user) {
  const nome = user.name || user.nome;
  const username = user.username;
  const senha = user.password || '';
  const acesso = user.access || 'ambos';
  const hashedSenha = await hashPassword(senha);

  const payload = {
    nome,
    username,
    senha: hashedSenha,
    acesso,
    must_change_password: true
  };

  let result = await supabase
    .from('usuarios')
    .insert(payload)
    .select('*')
    .single();

  if (result.error && typeof result.error.message === 'string' && result.error.message.includes('must_change_password')) {
    console.warn('[userService] fallback sem must_change_password devido a schema antigo');
    result = await supabase
      .from('usuarios')
      .insert({ nome, username, senha: hashedSenha, acesso })
      .select('*')
      .single();
  }

  if (result.error) throw result.error;
  return sanitizeUser(result.data);
}

async function updateUser(id, updates) {
  const payload = {};
  if (updates.name     || updates.nome)   payload.nome     = updates.name || updates.nome;
  if (updates.username)                   payload.username  = updates.username;
  if (updates.password)                   payload.senha     = await hashPassword(updates.password);
  if (updates.access   || updates.acesso) payload.acesso    = updates.access || updates.acesso;

  const { data, error } = await supabase
    .from('usuarios').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return sanitizeUser(data);
}

async function changeUserPassword(id, newPassword) {
  if (!id || !newPassword) throw new Error('invalid_params');
  const hashed = await hashPassword(newPassword);
  let result = await supabase
    .from('usuarios')
    .update({ senha: hashed, must_change_password: false })
    .eq('id', id)
    .select()
    .single();

  if (result.error && typeof result.error.message === 'string' && result.error.message.includes('must_change_password')) {
    console.warn('[userService] fallback de update sem must_change_password devido a schema antigo');
    result = await supabase
      .from('usuarios')
      .update({ senha: hashed })
      .eq('id', id)
      .select()
      .single();
  }

  if (result.error) throw result.error;
  return sanitizeUser(result.data);
}

async function deleteUser(id) {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
}

async function authenticateUser(identifier, password) {
  if (!identifier || !password) return null;

  const user = await findUserByIdentifier(identifier);
  if (!user) return null;

  const storedHash = user.senha || '';
  if (!storedHash) return null;

  const { valid, needsMigration } = await verifyPassword(password, storedHash);
  if (!valid) return null;

  if (needsMigration) {
    console.log(`[auth] Migrando senha SHA-256 → bcrypt para usuário id=${user.id}`);
    const novaSenha = await hashPassword(password);
    await supabase
      .from('usuarios')
      .update({ senha: novaSenha })
      .eq('id', user.id);
  }

  return sanitizeUser(user);
}

module.exports = {
  findUserByIdentifier,
  getUserById,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser,
  changeUserPassword
};