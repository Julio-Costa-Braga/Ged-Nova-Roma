const supabase = require('../db/supabaseClient');

async function listColaboradores({ status, page = 1, limit = 50 } = {}) {
  const from = (Math.max(1, page) - 1) * limit;
  const to   = from + Math.min(100, limit) - 1;

  let query = supabase
    .from('colaboradores')
    .select('*', { count: 'exact' })
    .order('nome')
    .range(from, to);

  if (status) query = query.eq('situacao', status);

  const { data, error, count } = await query;
  if (error) throw error;
  return { colaboradores: data || [], total: count ?? 0, page, limit };
}

async function getColaboradorById(id) {
  const { data, error } = await supabase
    .from('colaboradores').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function createColaborador(payload) {
  const cleanedPayload = Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) => value !== undefined && value !== null)
  );
  const { data, error } = await supabase
    .from('colaboradores').insert(cleanedPayload).select().single();
  if (error) throw error;
  return data;
}

async function updateColaborador(id, payload) {
  const cleanedPayload = Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) => value !== undefined && value !== null)
  );
  const { data, error } = await supabase
    .from('colaboradores').update(cleanedPayload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteColaborador(id) {
  const { error } = await supabase.from('colaboradores').delete().eq('id', id);
  if (error) throw error;
}

async function deleteSampleColaboradores() {
  const sampleEmails = [
    'carlos@email.com', 'carlos@novaroma.edu.br',
    'ana@email.com', 'ana@novaroma.edu.br',
    'roberto@email.com', 'roberto@novaroma.edu.br',
    'carlos.silva@email.com', 'carlos.silva@novaroma.edu.br',
    'ana.santos@email.com', 'ana.santos@novaroma.edu.br',
    'roberto.costa@email.com', 'roberto.costa@novaroma.edu.br',
    'fernanda.lima@email.com', 'fernanda.lima@novaroma.edu.br',
    'lucas.ferreira@email.com', 'lucas.ferreira@novaroma.edu.br'
  ];
  const sampleMatriculas = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005'];

  const deleteByEmailPessoal = await supabase
    .from('colaboradores')
    .delete()
    .in('email_pessoal', sampleEmails)
    .select('id');
  if (deleteByEmailPessoal.error) throw deleteByEmailPessoal.error;

  const deleteByEmailCorporativo = await supabase
    .from('colaboradores')
    .delete()
    .in('email_corporativo', sampleEmails)
    .select('id');
  if (deleteByEmailCorporativo.error) throw deleteByEmailCorporativo.error;

  const deleteByMatricula = await supabase
    .from('colaboradores')
    .delete()
    .in('matricula', sampleMatriculas)
    .select('id');
  if (deleteByMatricula.error) throw deleteByMatricula.error;

  return {
    email_pessoal_deleted: deleteByEmailPessoal.data?.length || 0,
    email_corporativo_deleted: deleteByEmailCorporativo.data?.length || 0,
    matricula_deleted: deleteByMatricula.data?.length || 0
  };
}

async function listColaboradoresForPlanilha({ status } = {}) {
  let query = supabase.from('colaboradores').select('*').order('nome');
  if (status) query = query.eq('situacao', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function listDocumentosByColaborador(colaboradorId) {
  const { data, error } = await supabase
    .from('pastas_documentos')
    .select('*', { count: 'exact' })
    .eq('colaborador_id', colaboradorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return { documentos: data || [] };
}

async function addDocumento(payload) {
  const { data, error } = await supabase
    .from('pastas_documentos').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function deleteDocumento(id) {
  const { error } = await supabase.from('pastas_documentos').delete().eq('id', id);
  if (error) throw error;
}

async function ensureStorageBucket(bucket) {
  const { data, error } = await supabase.storage.createBucket(bucket, { public: true });
  if (error) {
    const message = (typeof error.message === 'string' ? error.message : 'Erro ao criar bucket.');
    if (error.status === 409 || message.includes('already exists')) {
      return data;
    }
    throw error;
  }
  return data;
}

// Upload binary file to Supabase Storage and persist metadata with public URL
async function uploadDocumentoFile(colaboradorId, fileBuffer, filename, metadata = {}) {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documentos';
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const caminho = `colaboradores/${colaboradorId}/${Date.now()}_${safeName}`;

  async function doUpload() {
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(caminho, fileBuffer, {
      contentType: metadata.tipo || 'application/octet-stream',
      upsert: false
    });
    if (uploadError) {
      throw uploadError;
    }
    return uploadData;
  }

  try {
    await doUpload();
  } catch (uploadError) {
    const message = uploadError?.message || '';
    if (uploadError?.status === 404 || message.includes('Bucket not found')) {
      await ensureStorageBucket(bucket);
      await doUpload();
    } else {
      throw uploadError;
    }
  }

  // get public URL (requires bucket public or configured)
  const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(caminho);
  const publicUrl = urlData?.publicUrl || '';

  const payload = {
    colaborador_id: colaboradorId,
    categoria: metadata.categoria || 'Sem categoria',
    nome_arquivo: metadata.nome_arquivo || filename,
    tamanho: metadata.tamanho || (Math.round((fileBuffer.length||0)/1024) + ' KB'),
    data_upload: metadata.data_upload || new Date().toISOString().split('T')[0],
    status: metadata.status || 'Enviado',
    tipo: metadata.tipo || '',
    observacao: metadata.observacao || '',
    url_arquivo: publicUrl
  };

  const documento = await addDocumento(payload);
  return documento;
}


async function listMovimentacoesByColaborador(colaboradorId) {
  const { data, error } = await supabase
    .from('movimentacoes_rh')
    .select('*')
    .eq('colaborador_id', colaboradorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return { movimentacoes: data || [] };
}

async function addMovimentacao(payload) {
  const { data, error } = await supabase
    .from('movimentacoes_rh').insert(payload).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  listColaboradores, listColaboradoresForPlanilha, getColaboradorById, createColaborador,
  updateColaborador, deleteColaborador, deleteSampleColaboradores,
  listDocumentosByColaborador, addDocumento, deleteDocumento,
  listMovimentacoesByColaborador, addMovimentacao, uploadDocumentoFile
};
