const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const frontendDir = path.join(__dirname, 'frontend');
const RENDER_HOST = 'ged-nova-roma-backend.onrender.com';

app.use(express.json());

app.all('/NOVAROMA/api/*', (req, res) => {
  const apiPath = req.path.replace('/NOVAROMA/api', '/NOVAROMA/api');
  const options = {
    hostname: RENDER_HOST,
    port: 443,
    path: apiPath + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''),
    method: req.method,
    headers: { ...req.headers, host: RENDER_HOST }
  };
  delete options.headers['x-forwarded-host'];
  delete options.headers['x-vercel-id'];
  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    Object.keys(proxyRes.headers).forEach(k => res.setHeader(k, proxyRes.headers[k]));
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => res.status(502).json({ error: 'Erro ao conectar com o backend.' }));
  req.pipe(proxyReq);
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
