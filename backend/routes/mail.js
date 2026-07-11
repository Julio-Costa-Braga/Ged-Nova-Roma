const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../services/mailService');

router.post('/test', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Informe o e-mail de destino no body { "email": "x@x.com" }' });
  try {
    const result = await sendTestEmail(email);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('Erro ao enviar e-mail de teste:', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: err.message || 'Erro interno' });
  }
});

module.exports = router;
