const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const frontendDir = path.join(__dirname, 'frontend');
const RENDER_URL = 'https://ged-nova-roma-backend.onrender.com';

app.use('/NOVAROMA/api', express.json());

app.all('/NOVAROMA/api/*', async (req, res) => {
  try {
    const url = RENDER_URL + req.url;
    const headers = { ...req.headers, host: 'ged-nova-roma-backend.onrender.com' };
    delete headers['x-forwarded-host'];
    delete headers['x-vercel-id'];
    delete headers['content-length'];
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);
    const fetchRes = await fetch(url, {
      method: req.method,
      headers,
      body
    });
    res.status(fetchRes.status);
    fetchRes.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await fetchRes.text();
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'Erro ao conectar com o backend.' });
  }
});

app.get('/', (req, res) => res.redirect('/NOVAROMA/'));
app.use('/NOVAROMA', express.static(frontendDir));

app.get('/NOVAROMA/*', (req, res) => {
  const relativePath = req.path.replace('/NOVAROMA', '') || '/index.html';
  const filePath = path.join(frontendDir, relativePath);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

module.exports = app;
