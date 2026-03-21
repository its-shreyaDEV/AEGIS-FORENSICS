const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Mock data store (replace with real DB)
let evidenceLog = [
  { id: 'EVD-0042', officer: 'Off. R. Sharma', time: '03:41:22 UTC', gps: '20.2961°N, 85.8245°E', hash: 'a3f9c2e1d847b650f2318a94cc71e302b8456d91e0f3a7285c6b4d019e8f3a21', status: 'verified', phase: 3, weaponMatch: 'Serrated blade (87%)' },
  { id: 'EVD-0041', officer: 'Off. P. Das', time: '01:12:05 UTC', gps: '20.2948°N, 85.8201°E', hash: 'b1e8f4c2a93d571e0249c85bb60d214f7a39e825d1c46b807f92a358d0e7c412', status: 'verified', phase: 2, weaponMatch: 'Pending' },
  { id: 'EVD-0040', officer: 'Off. K. Nair', time: '22:58:44 UTC', gps: '20.2979°N, 85.8312°E', hash: 'c9d0a7e3b2514f8a1036d47cc89e352b0f25a96e4d817c3029b46f175e8d0523', status: 'compromised', phase: 1, weaponMatch: '—' },
];

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/capture', (req, res) => res.sendFile(path.join(__dirname, 'public', 'capture.html')));
app.get('/evidence', (req, res) => res.sendFile(path.join(__dirname, 'public', 'evidence.html')));
app.get('/analysis', (req, res) => res.sendFile(path.join(__dirname, 'public', 'analysis.html')));

// API
app.get('/api/evidence', (req, res) => res.json({ success: true, data: evidenceLog }));
app.get('/api/stats', (req, res) => res.json({
  total: evidenceLog.length,
  verified: evidenceLog.filter(e => e.status === 'verified').length,
  compromised: evidenceLog.filter(e => e.status === 'compromised').length,
  pending: evidenceLog.filter(e => e.phase < 3).length,
}));

app.post('/api/evidence', (req, res) => {
  const entry = {
    id: 'EVD-' + String(evidenceLog.length + 43).padStart(4, '0'),
    officer: req.body.officer || 'Unknown',
    time: new Date().toISOString(),
    gps: req.body.gps || '0.0000°N, 0.0000°E',
    hash: [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    status: 'verified',
    phase: 1,
    weaponMatch: 'Pending',
  };
  evidenceLog.unshift(entry);
  res.json({ success: true, data: entry });
});

app.listen(PORT, () => console.log(`\n  AEGIS-FORENSICS running at http://localhost:${PORT}\n`));
