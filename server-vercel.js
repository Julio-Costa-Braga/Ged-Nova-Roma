const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const frontendDir = path.join(__dirname, 'frontend');

app.get('/', (req, res) => res.redirect('/NOVAROMA/'));
app.use('/NOVAROMA', express.static(frontendDir));

app.get('/NOVAROMA/*', (req, res) => {
  const relativePath = req.path.replace('/NOVAROMA', '') || '/index.html';
  const filePath = path.join(frontendDir, relativePath);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

module.exports = app;
