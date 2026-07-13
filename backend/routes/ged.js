const express = require('express');
const { z } = require('zod');
const {
  listDocumentosGed, getDocumentoById,
  createDocumento, updateDocumento, deleteDocumento,
  listDocumentAttachments, uploadDocumentoAttachment
} = require('../services/gedService');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validatePositiveInteger, logAudit, createAuditLog } = require('../middleware/security');

const router = express.Router();
router.use(requireAuth);

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createDocSchema = z.object({
  tipo_documento:  z.string().min(1, 'tipo_documento é obrigatório.'),
  setor:           z.string().min(1, 'setor é obrigatório.'),
  nome_arquivo:    z.string().min(1, 'nome_arquivo é obrigatório.'),
  cpf:             z.string().optional().default(''),
  cnpj:            z.string().optional().default(''),
  valor:           z.number().nonnegative().optional().default(0),
  tipo_financeiro: z.enum(['', 'Receita', 'Despesa']).optional().default(''),
  data_envio:      z.string().optional(),
  data_vencimento: z.string().optional(),
  numero_nota:     z.string().optional().default(''),
  tags:            z.array(z.string()).optional().default([]),
  codigo_siga:     z.string().optional().default(''),
  data_validade:   z.string().optional(),
  lembrete_dias:   z.number().int().min(0).optional().default(0),
  email_assinante: z.string().email().optional().or(z.literal('')).default(''),
  url_arquivo:     z.string().optional().default(''),
  status:          z.string().optional().default('Pendente')
});

const updateDocSchema = createDocSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'Envie ao menos um campo para atualizar.' }
);

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: result.error.flatten().fieldErrors
      });
    }
    req.body = result.data;
    return next();
  };
}

// ─── Rotas ───────────────────────────────────────────────────────────────────

// Leitura: qualquer usuário autenticado
router.get('/documentos', async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const filtros = {
      setor:          req.query.setor,
      tipo_documento: req.query.tipo_documento,
      search:         req.query.search,
      page, limit
    };
    const result = await listDocumentosGed(filtros);
    return res.json(result);
  } catch (error) {
    console.error('List GED documents error:', error);
    return res.status(500).json({ error: 'Erro ao listar documentos GED.' });
  }
});

router.get('/documentos/:id', async (req, res) => {
  try {
    const documentoId = validatePositiveInteger(req.params.id, 'Document ID');
    const documento = await getDocumentoById(documentoId);
    if (!documento) return res.status(404).json({ error: 'Documento não encontrado.' });
    return res.json({ documento });
  } catch (error) {
    if (error.message.includes('inválido')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Get GED document error:', error.message);
    return res.status(500).json({ error: 'Erro ao obter documento GED.' });
  }
});

router.get('/documentos/:id/anexos', async (req, res) => {
  try {
    const documentoId = validatePositiveInteger(req.params.id, 'Document ID');
    const anexos = await listDocumentAttachments(documentoId);
    return res.json({ anexos });
  } catch (error) {
    if (error.message.includes('inválido')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('List GED document attachments error:', error.message);
    return res.status(500).json({ error: 'Erro ao listar anexos do documento.' });
  }
});

const attachmentSchema = z.object({
  nome_arquivo:  z.string().min(1, 'nome_arquivo é obrigatório.'),
  tipo_arquivo:  z.string().optional().default('application/octet-stream'),
  tamanho:       z.string().optional().default(''),
  arquivo_base64: z.string().min(1, 'arquivo_base64 é obrigatório.')
});

router.post('/documentos/:id/anexos',
  requireRole('administrador', 'financeiro'),
  validate(attachmentSchema),
  async (req, res) => {
    try {
      const documentoId = validatePositiveInteger(req.params.id, 'Document ID');
      const { nome_arquivo, tipo_arquivo, tamanho, arquivo_base64 } = req.body;
      const matches = arquivo_base64.match(/^data:(.+);base64,(.+)$/);
      const base64 = matches ? matches[2] : arquivo_base64;
      const fileBuffer = Buffer.from(base64, 'base64');
      const anexo = await uploadDocumentoAttachment(documentoId, fileBuffer, nome_arquivo, {
        tipo: tipo_arquivo,
        tamanho
      });
      
      logAudit(createAuditLog('upload_attachment', req.user.id, 'documento', {
        documentoId,
        filename: nome_arquivo,
        size: fileBuffer.length,
        ipAddress: req.ip
      }));
      
      return res.status(201).json({ anexo });
    } catch (error) {
      if (error.message.includes('inválido')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Upload GED attachment error:', error.message);
      return res.status(500).json({ error: 'Erro ao enviar anexo do documento.' });
    }
  }
);

// Escrita: apenas administrador, financeiro
router.post('/documentos',
  requireRole('administrador', 'financeiro'),
  validate(createDocSchema),
  async (req, res) => {
    try {
      const documento = await createDocumento(req.body);
      
      logAudit(createAuditLog('create_document', req.user.id, 'documento', {
        documentoId: documento.id,
        type: documento.tipo_documento,
        sector: documento.setor,
        ipAddress: req.ip
      }));
      
      return res.status(201).json({ documento });
    } catch (error) {
      console.error('Create GED document error:', error.message);
      return res.status(500).json({ error: 'Erro ao criar documento GED.' });
    }
  }
);

router.put('/documentos/:id',
  requireRole('administrador', 'financeiro'),
  validate(updateDocSchema),
  async (req, res) => {
    try {
      const documentoId = validatePositiveInteger(req.params.id, 'Document ID');
      const documento = await updateDocumento(documentoId, req.body);
      
      logAudit(createAuditLog('update_document', req.user.id, 'documento', {
        documentoId,
        changedFields: Object.keys(req.body),
        ipAddress: req.ip
      }));
      
      return res.json({ documento });
    } catch (error) {
      if (error.message.includes('inválido')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Update GED document error:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar documento GED.' });
    }
  }
);

router.delete('/documentos/:id',
  requireRole('administrador', 'financeiro'),
  async (req, res) => {
    try {
      const documentoId = validatePositiveInteger(req.params.id, 'Document ID');
      await deleteDocumento(documentoId);
      
      logAudit(createAuditLog('delete_document', req.user.id, 'documento', {
        documentoId,
        ipAddress: req.ip
      }));
      
      return res.status(204).send();
    } catch (error) {
      if (error.message.includes('inválido')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Delete GED document error:', error.message);
      return res.status(500).json({ error: 'Erro ao excluir documento GED.' });
    }
  }
);

// ─── Envio de e-mail para assinatura ──────────────────────────────────────

const { enviarEmailAssinatura } = require('../services/emailService');

const enviarAssinaturaSchema = z.object({
  documento_id: z.number().int().positive(),
  email: z.string().email(),
  nome_documento: z.string().min(1, 'nome_documento é obrigatório.')
});

router.post('/enviar-assinatura',
  requireRole('administrador', 'financeiro'),
  validate(enviarAssinaturaSchema),
  async (req, res) => {
    try {
      const { documento_id, email, nome_documento } = req.body;
      const basePath = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/|\/$/g, '')}` : '';
      const link = `${req.protocol}://${req.get('host')}${basePath}/sign.html?doc=${documento_id}`;

      const result = await enviarEmailAssinatura({
        destinatario: email,
        nomeDocumento: nome_documento,
        linkAssinatura: link
      });

      logAudit(createAuditLog('send_signature_email', req.user.id, 'documento', {
        documentoId: documento_id,
        email,
        ipAddress: req.ip
      }));

      return res.json({ success: true, message: 'E-mail de assinatura enviado com sucesso', result });
    } catch (error) {
      console.error('Send signature email error:', error.message);
      return res.status(500).json({ error: 'Erro ao enviar e-mail de assinatura.' });
    }
  }
);

module.exports = router;
