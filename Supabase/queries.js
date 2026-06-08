// Supabase query helpers for GED / RH / Financeiro
// Use these functions with a Supabase client created with your project URL and anon/public key.

function getSupabaseClient() {
  if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  }
  if (typeof supabase !== 'undefined') {
    return supabase;
  }
  throw new Error('Supabase client não inicializado. Importe supabase.js antes de usar estas funções.');
}

// ========== USUÁRIOS ==========
export async function listarUsuarios() {
  const { data, error } = await getSupabaseClient().from('usuarios').select('*');
  if (error) throw error;
  return data || [];
}

export async function buscarUsuario(username) {
  const { data, error } = await getSupabaseClient()
    .from('usuarios')
    .select('*')
    .eq('username', username)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function criarUsuario(usuario) {
  const { data, error } = await getSupabaseClient()
    .from('usuarios')
    .insert(usuario)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarUsuario(id, usuario) {
  const { data, error } = await getSupabaseClient()
    .from('usuarios')
    .update(usuario)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirUsuario(id) {
  const { error } = await getSupabaseClient().from('usuarios').delete().eq('id', id);
  if (error) throw error;
}

// ========== COLABORADORES (RH) ==========
export async function listarColaboradores(filtroStatus = null) {
  let query = getSupabaseClient().from('colaboradores').select('*').order('nome');
  if (filtroStatus) query = query.eq('situacao', filtroStatus);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function salvarColaborador(colaborador) {
  if (colaborador.id) {
    const { data, error } = await getSupabaseClient()
      .from('colaboradores')
      .update(colaborador)
      .eq('id', colaborador.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await getSupabaseClient()
    .from('colaboradores')
    .insert(colaborador)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirColaborador(id) {
  const { error } = await getSupabaseClient().from('colaboradores').delete().eq('id', id);
  if (error) throw error;
}

// ========== PASTAS DE DOCUMENTOS RH ==========
export async function listarPastasDocumentos(colaboradorId) {
  const { data, error } = await getSupabaseClient()
    .from('pastas_documentos')
    .select('*')
    .eq('colaborador_id', colaboradorId)
    .order('categoria');
  if (error) throw error;
  return data || [];
}

export async function adicionarDocumentoPasta(documento) {
  const { data, error } = await getSupabaseClient()
    .from('pastas_documentos')
    .insert(documento)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirDocumentoPasta(id) {
  const { error } = await getSupabaseClient().from('pastas_documentos').delete().eq('id', id);
  if (error) throw error;
}

// ========== MOVIMENTAÇÕES RH ==========
export async function listarMovimentacoesRh(colaboradorId) {
  const { data, error } = await getSupabaseClient()
    .from('movimentacoes_rh')
    .select('*')
    .eq('colaborador_id', colaboradorId)
    .order('categoria');
  if (error) throw error;
  return data || [];
}

export async function adicionarMovimentacaoRh(movimentacao) {
  const { data, error } = await getSupabaseClient()
    .from('movimentacoes_rh')
    .insert(movimentacao)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========== CONTRATOS ==========
export async function listarContratos(colaboradorId) {
  const { data, error } = await getSupabaseClient()
    .from('contratos')
    .select('*')
    .eq('colaborador_id', colaboradorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarContrato(contrato) {
  const { data, error } = await getSupabaseClient()
    .from('contratos')
    .insert(contrato)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========== DOCUMENTOS GED ==========
export async function listarDocumentosGed(filtros = {}) {
  let query = getSupabaseClient().from('documentos_ged').select('*').order('created_at', { ascending: false });
  if (filtros.setor) query = query.eq('setor', filtros.setor);
  if (filtros.tipo) query = query.eq('tipo_documento', filtros.tipo);
  if (filtros.search) query = query.or(`tipo_documento.ilike.%${filtros.search}%,setor.ilike.%${filtros.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function salvarDocumentoGed(documento) {
  if (documento.id) {
    const { data, error } = await getSupabaseClient()
      .from('documentos_ged')
      .update(documento)
      .eq('id', documento.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await getSupabaseClient()
    .from('documentos_ged')
    .insert(documento)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirDocumentoGed(id) {
  const { error } = await getSupabaseClient().from('documentos_ged').delete().eq('id', id);
  if (error) throw error;
}

// ========== TRANSAÇÕES FINANCEIRAS ==========
export async function listarTransacoes(filtros = {}) {
  let query = getSupabaseClient().from('transacoes_financeiras').select('*').order('data', { ascending: false });
  if (filtros.mes) query = query.eq('extract(month from data)', filtros.mes);
  if (filtros.centro_custo) query = query.eq('centro_custo', filtros.centro_custo);
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function salvarTransacao(transacao) {
  if (transacao.id) {
    const { data, error } = await getSupabaseClient()
      .from('transacoes_financeiras')
      .update(transacao)
      .eq('id', transacao.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await getSupabaseClient()
    .from('transacoes_financeiras')
    .insert(transacao)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirTransacao(id) {
  const { error } = await getSupabaseClient().from('transacoes_financeiras').delete().eq('id', id);
  if (error) throw error;
}

// ========== ANEXOS DE DOCUMENTOS ==========
export async function listarAnexos(documentoId) {
  const { data, error } = await getSupabaseClient()
    .from('anexos_documentos')
    .select('*')
    .eq('documento_id', documentoId);
  if (error) throw error;
  return data || [];
}

// ========== STORAGE ==========
export async function uploadArquivo(bucket, caminho, arquivo) {
  const { data, error } = await getSupabaseClient().storage.from(bucket).upload(caminho, arquivo);
  if (error) throw error;
  return data;
}

export async function urlPublicaArquivo(bucket, caminho) {
  const { data } = await getSupabaseClient().storage.from(bucket).getPublicUrl(caminho);
  return data?.publicUrl || '';
}
