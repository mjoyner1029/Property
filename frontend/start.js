#!/usr/bin/env node
// Simple static server with runtime env injection for CRA build
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const buildDir = path.join(__dirname, 'build');

// Expose runtime env to window.__APP_API_URL__
app.get('/env.js', (_req, res) => {
  const api = process.env.REACT_APP_API_URL || process.env.API_URL || 'http://localhost:5050/api';
  res.type('application/javascript');
  res.send(`window.__APP_API_URL__=${JSON.stringify(api)};`);
});

app.use(express.static(buildDir));
app.get('*', (_req, res) => res.sendFile(path.join(buildDir, 'index.html')));

app.listen(port, () => {
  console.log(`Frontend listening on :${port}`);
});