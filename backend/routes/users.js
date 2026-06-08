const express = require('express');
const { z } = require('zod');
const { listUsers, getUserById, createUser, updateUser, deleteUser, changeUserPassword } = require('../services/userService');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(requireAuth);

// ─── Schemas de validação (Zod) ───────────────────────────────────────────────

const ACESSO_VALUES = ['financeiro', 'rh', 'ambos', 'apenas-observador'];

const createUserSchema = z.object({
  name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  username: z.string().min(3, 'Username deve ter ao menos 3 caracteres.')
             .regex(/^[a-zA-Z0-9@._-]+$/, 'Username só pode conter letras, números, @, . _ -'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres.'),
  access:   z.enum(ACESSO_VALUES).optional().default('ambos')
});

const updateUserSchema = z.object({
  name:     z.string().min(2).optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9@._-]+$/).optional(),
  password: z.string().min(8).optional(),
  access:   z.enum(ACESSO_VALUES).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Envie ao menos um campo para atualizar.'
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

// Apenas administrador pode listar/gerenciar usuários
router.get('/', requireRole('administrador'), async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const result = await listUsers({ page, limit });
    return res.json(result);
  } catch (error) {
    console.error('Users list error:', error);
    return res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

router.get('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const user = await getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Erro ao obter usuário.' });
  }
});

router.post('/', requireRole('administrador'), validate(createUserSchema), async (req, res) => {
  try {
    const user = await createUser(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') { // unique_violation no Postgres
      return res.status(409).json({ error: 'Username já está em uso.' });
    }
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

router.put('/:id', requireRole('administrador'), validate(updateUserSchema), async (req, res) => {
  try {
    const user = await updateUser(Number(req.params.id), req.body);
    return res.json({ user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username já está em uso.' });
    }
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

router.delete('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    // Impede auto-deleção
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário.' });
    }

    // Impede deletar o usuário admin principal
    const userToDelete = await getUserById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    if (userToDelete.username === 'admin') {
      return res.status(400).json({ error: 'O administrador principal não pode ser excluído.' });
    }

    // Impede deletar o último administrador
    if (userToDelete.role === 'administrador') {
      const { data: admins, error } = await require('../db/supabaseClient')
        .from('usuarios')
        .select('id')
        .eq('role', 'administrador');
      if (error) throw error;
      if (Array.isArray(admins) && admins.length <= 1) {
        return res.status(400).json({ error: 'O sistema precisa ter pelo menos um administrador.' });
      }
    }

    await deleteUser(userId);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// Alterar senha do usuário autenticado
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const newPassword = req.body && req.body.newPassword;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Nova senha inválida. Deve ter ao menos 8 caracteres.' });
    }
    const updated = await changeUserPassword(req.user.id, newPassword);
    return res.json({ user: updated });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

module.exports = router;
