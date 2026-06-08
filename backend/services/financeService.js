const supabase = require('../db/supabaseClient');

function formatMonthRange(mes, ano) {
  const month = Number(mes);
  const year  = Number(ano) || new Date().getFullYear();
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10)
  };
}

async function listTransacoes(filters = {}) {
  const page  = Math.max(1, Number(filters.page)  || 1);
  const limit = Math.min(100, Number(filters.limit) || 50);
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  let query = supabase
    .from('transacoes_financeiras')
    .select('*', { count: 'exact' })
    .order('data', { ascending: false })
    .range(from, to);

  if (filters.tipo)         query = query.eq('tipo', filters.tipo);
  if (filters.centro_custo) query = query.eq('centro_custo', filters.centro_custo);
  if (filters.mes) {
    const range = formatMonthRange(filters.mes, filters.ano);
    if (range) query = query.gte('data', range.start).lt('data', range.end);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { transacoes: data || [], total: count ?? 0, page, limit };
}

async function getTransacaoById(id) {
  const { data, error } = await supabase
    .from('transacoes_financeiras').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function createTransacao(payload) {
  const { data, error } = await supabase
    .from('transacoes_financeiras').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateTransacao(id, payload) {
  const { data, error } = await supabase
    .from('transacoes_financeiras').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteTransacao(id) {
  const { error } = await supabase.from('transacoes_financeiras').delete().eq('id', id);
  if (error) throw error;
}

module.exports = { listTransacoes, getTransacaoById, createTransacao, updateTransacao, deleteTransacao };
