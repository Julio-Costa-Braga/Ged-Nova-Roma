const supabase = require('../db/supabaseClient');

async function listDocumentosGed(filters = {}) {
  const page  = Math.max(1, Number(filters.page)  || 1);
  const limit = Math.min(100, Number(filters.limit) || 50);
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  let query = supabase
    .from('documentos_ged')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.setor)          query = query.eq('setor', filters.setor);
  if (filters.tipo_documento) query = query.eq('tipo_documento', filters.tipo_documento);
  if (filters.search) {
    const s = `%${String(filters.search).trim()}%`;
    query = query.or(`tipo_documento.ilike.${s},setor.ilike.${s}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { documentos: data || [], total: count ?? 0, page, limit };
}

async function getDocumentoById(id) {
  const { data, error } = await supabase
    .from('documentos_ged').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function createDocumento(payload) {
  const { data, error } = await supabase
    .from('documentos_ged').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function listDocumentAttachments(documentoId) {
  const { data, error } = await supabase
    .from('anexos_documentos')
    .select('*')
    .eq('documento_id', documentoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
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

async function uploadDocumentoAttachment(documentoId, fileBuffer, filename, metadata = {}) {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documentos';
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const caminho = `ged/${documentoId}/${Date.now()}_${safeName}`;

  async function doUpload() {
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(caminho, fileBuffer, {
      contentType: metadata.tipo || 'application/octet-stream',
      upsert: false
    });
    if (uploadError) throw uploadError;
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

  const { data: urlData, error: urlError } = await supabase.storage.from(bucket).getPublicUrl(caminho);
  if (urlError) throw urlError;
  const publicUrl = urlData?.publicUrl || '';

  const payload = {
    documento_id: documentoId,
    nome_arquivo: filename,
    url_arquivo: publicUrl,
    tamanho: metadata.tamanho || `${Math.round((fileBuffer.length || 0) / 1024)} KB`
  };

  const { data, error } = await supabase
    .from('anexos_documentos').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateDocumento(id, payload) {
  const { data, error } = await supabase
    .from('documentos_ged').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteDocumento(id) {
  const { error } = await supabase.from('documentos_ged').delete().eq('id', id);
  if (error) throw error;
}

module.exports = {
  listDocumentosGed,
  getDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  listDocumentAttachments,
  uploadDocumentoAttachment
};
