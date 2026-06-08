const express = require('express');
const { z } = require('zod');
const multer = require('multer');
const uploadMemory = multer({ storage: multer.memoryStorage() });
const {
  listColaboradores, listColaboradoresForPlanilha, getColaboradorById,
  createColaborador, updateColaborador, deleteColaborador, deleteSampleColaboradores,
  listDocumentosByColaborador, addDocumento, deleteDocumento,
  listMovimentacoesByColaborador, addMovimentacao,
  uploadDocumentoFile
} = require('../services/rhService');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ─── Schemas ─────────────────────────────────────────────────────────────────

const colaboradorSchema = z.object({
  nome:              z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  funcao:            z.string().optional().default(''),
  situacao:          z.enum(['Ativo', 'Inativo']).optional().default('Ativo'),
  admissao:          z.string().optional(),
  demissao:          z.string().optional(),
  matricula:         z.string().optional().default(''),
  localizacao:       z.string().optional().default(''),
  unidade:           z.string().optional().default(''),
  data_nasc:         z.string().optional(),
  remuneracao:       z.number().nonnegative().optional().default(0),
  telefone:          z.string().optional().default(''),
  rg:                z.string().optional().default(''),
  cpf:               z.string().optional().default(''),
  pis:               z.string().optional().default(''),
  sexo:              z.string().optional().default(''),
  pai_mae:           z.string().optional().default(''),
  titulacao:         z.string().optional().default(''),
  curso:             z.string().optional().default(''),
  email_pessoal:     z.string().email().optional().or(z.literal('')).default(''),
  email_corporativo: z.string().email().optional().or(z.literal('')).default('')
});

const documentoSchema = z.object({
  colaborador_id: z.number().int().positive('colaborador_id é obrigatório.'),
  categoria:      z.string().min(1, 'categoria é obrigatória.'),
  nome_arquivo:   z.string().min(1, 'nome_arquivo é obrigatório.'),
  tamanho:        z.string().optional().default(''),
  data_upload:    z.string().optional(),
  status:         z.string().optional().default('Enviado'),
  tipo:           z.string().optional().default(''),
  observacao:     z.string().optional().default('')
});

const movimentacaoSchema = z.object({
  colaborador_id: z.number().int().positive(),
  categoria:      z.string().min(1),
  nome_arquivo:   z.string().min(1),
  tamanho:        z.string().optional().default(''),
  data_upload:    z.string().optional()
});

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

// ─── Colaboradores ───────────────────────────────────────────────────────────

router.get('/colaboradores', async (req, res) => {
  try {
    const page   = Math.max(1, Number(req.query.page)   || 1);
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const result = await listColaboradores({ status: req.query.status, page, limit });
    return res.json(result);
  } catch (error) {
    console.error('List colaboradores error:', error);
    return res.status(500).json({ error: 'Erro ao listar colaboradores.' });
  }
});

router.get('/colaboradores/planilha',
  requireRole('administrador', 'rh'),
  async (req, res) => {
    try {
      const colaboradores = await listColaboradoresForPlanilha({ status: req.query.status });
      return res.json({ colaboradores });
    } catch (error) {
      console.error('List colaboradores planilha error:', error);
      return res.status(500).json({ error: 'Erro ao listar planilha de colaboradores.' });
    }
  }
);

router.delete('/colaboradores/testes',
  requireRole('administrador', 'rh'),
  async (req, res) => {
    try {
      const result = await deleteSampleColaboradores();
      return res.json({ deleted: result });
    } catch (error) {
      console.error('Delete sample colaboradores error:', error);
      return res.status(500).json({ error: 'Erro ao remover colaboradores de teste.' });
    }
  }
);

router.get('/colaboradores/:id', async (req, res) => {
  try {
    const colaborador = await getColaboradorById(Number(req.params.id));
    if (!colaborador) return res.status(404).json({ error: 'Colaborador não encontrado.' });
    return res.json({ colaborador });
  } catch (error) {
    console.error('Get colaborador error:', error);
    return res.status(500).json({ error: 'Erro ao obter colaborador.' });
  }
});

router.post('/colaboradores',
  requireRole('administrador', 'rh'),
  validate(colaboradorSchema),
  async (req, res) => {
    try {
      const colaborador = await createColaborador(req.body);
      return res.status(201).json({ colaborador });
    } catch (error) {
      console.error('Create colaborador error:', error);
      return res.status(500).json({ error: 'Erro ao criar colaborador.' });
    }
  }
);

router.put('/colaboradores/:id',
  requireRole('administrador', 'rh'),
  validate(colaboradorSchema.partial()),
  async (req, res) => {
    try {
      const colaborador = await updateColaborador(Number(req.params.id), req.body);
      return res.json({ colaborador });
    } catch (error) {
      console.error('Update colaborador error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar colaborador.' });
    }
  }
);

router.delete('/colaboradores/:id',
  requireRole('administrador', 'rh'),
  async (req, res) => {
    try {
      await deleteColaborador(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      console.error('Delete colaborador error:', error);
      return res.status(500).json({ error: 'Erro ao excluir colaborador.' });
    }
  }
);

// ─── Documentos RH ───────────────────────────────────────────────────────────

router.post('/colaboradores/:id/documentos/upload',
  requireRole('administrador', 'rh'),
  uploadMemory.single('file'),
  async (req, res) => {
    try {
      const colaboradorId = Number(req.params.id);
      if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
      const file = req.file; // buffer available in file.buffer
      const { categoria = '', observacao = '', tipo = '' } = req.body || {};
      const payload = {
        categoria: categoria || 'Sem categoria',
        nome_arquivo: file.originalname || 'arquivo',
        tamanho: req.body.tamanho || (Math.round((file.size||0)/1024) + ' KB'),
        data_upload: new Date().toISOString().split('T')[0],
        tipo: tipo || file.mimetype || '',
        observacao: observacao || ''
      };
      const documento = await uploadDocumentoFile(colaboradorId, file.buffer, file.originalname, payload);
      return res.status(201).json({ documento });
    } catch (error) {
      console.error('Upload documento error:', error);
      return res.status(500).json({ error: 'Erro ao enviar documento.' });
    }
  }
);

router.get('/colaboradores/:id/documentos', async (req, res) => {
  try {
    const result = await listDocumentosByColaborador(Number(req.params.id));
    return res.json(result);
  } catch (error) {
    console.error('List documentos error:', error);
    return res.status(500).json({ error: 'Erro ao listar documentos.' });
  }
});

router.post('/documentos',
  requireRole('administrador', 'rh'),
  validate(documentoSchema),
  async (req, res) => {
    try {
      const documento = await addDocumento(req.body);
      return res.status(201).json({ documento });
    } catch (error) {
      console.error('Create documento error:', error);
      return res.status(500).json({ error: 'Erro ao adicionar documento.' });
    }
  }
);

router.delete('/documentos/:id',
  requireRole('administrador', 'rh'),
  async (req, res) => {
    try {
      await deleteDocumento(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      console.error('Delete documento error:', error);
      return res.status(500).json({ error: 'Erro ao excluir documento.' });
    }
  }
);

// ─── Movimentações ───────────────────────────────────────────────────────────

router.get('/colaboradores/:id/movimentacoes', async (req, res) => {
  try {
    const result = await listMovimentacoesByColaborador(Number(req.params.id));
    return res.json(result);
  } catch (error) {
    console.error('List movimentacoes error:', error);
    return res.status(500).json({ error: 'Erro ao listar movimentações RH.' });
  }
});

router.post('/movimentacoes',
  requireRole('administrador', 'rh'),
  validate(movimentacaoSchema),
  async (req, res) => {
    try {
      const movimentacao = await addMovimentacao(req.body);
      return res.status(201).json({ movimentacao });
    } catch (error) {
      console.error('Create movimentacao error:', error);
      return res.status(500).json({ error: 'Erro ao adicionar movimentação RH.' });
    }
  }
);

module.exports = router;
