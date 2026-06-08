const express = require('express');
const { z } = require('zod');
const {
  listTransacoes, getTransacaoById,
  createTransacao, updateTransacao, deleteTransacao
} = require('../services/financeService');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ─── Schemas ─────────────────────────────────────────────────────────────────

const transacaoSchema = z.object({
  data:         z.string().min(1, 'data é obrigatória.'),
  descricao:    z.string().min(1, 'descricao é obrigatória.'),
  centro_custo: z.string().min(1, 'centro_custo é obrigatório.'),
  tipo:         z.enum(['Receita', 'Despesa'], { errorMap: () => ({ message: "tipo deve ser 'Receita' ou 'Despesa'." }) }),
  valor:        z.number().nonnegative('valor deve ser positivo.')
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

// ─── Rotas ───────────────────────────────────────────────────────────────────

router.get('/transacoes', async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const filtros = {
      tipo:         req.query.tipo,
      centro_custo: req.query.centro_custo,
      mes:          req.query.mes,
      ano:          req.query.ano,
      page, limit
    };
    const result = await listTransacoes(filtros);
    return res.json(result);
  } catch (error) {
    console.error('List finance transactions error:', error);
    return res.status(500).json({ error: 'Erro ao listar transações financeiras.' });
  }
});

router.get('/transacoes/:id', async (req, res) => {
  try {
    const transacao = await getTransacaoById(Number(req.params.id));
    if (!transacao) return res.status(404).json({ error: 'Transação não encontrada.' });
    return res.json({ transacao });
  } catch (error) {
    console.error('Get finance transaction error:', error);
    return res.status(500).json({ error: 'Erro ao obter transação.' });
  }
});

router.post('/transacoes',
  requireRole('administrador', 'financeiro'),
  validate(transacaoSchema),
  async (req, res) => {
    try {
      const transacao = await createTransacao(req.body);
      return res.status(201).json({ transacao });
    } catch (error) {
      console.error('Create finance transaction error:', error);
      return res.status(500).json({ error: 'Erro ao criar transação financeira.' });
    }
  }
);

router.put('/transacoes/:id',
  requireRole('administrador', 'financeiro'),
  validate(transacaoSchema.partial()),
  async (req, res) => {
    try {
      const transacao = await updateTransacao(Number(req.params.id), req.body);
      return res.json({ transacao });
    } catch (error) {
      console.error('Update finance transaction error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar transação.' });
    }
  }
);

router.delete('/transacoes/:id',
  requireRole('administrador', 'financeiro'),
  async (req, res) => {
    try {
      await deleteTransacao(Number(req.params.id));
      return res.status(204).send();
    } catch (error) {
      console.error('Delete finance transaction error:', error);
      return res.status(500).json({ error: 'Erro ao excluir transação.' });
    }
  }
);

module.exports = router;
