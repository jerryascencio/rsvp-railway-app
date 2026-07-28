import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const guestsFile = path.join(dataDir, 'guests.json');
const responsesFile = path.join(dataDir, 'responses.json');

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function ensure(file, fallback) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
}

ensure(guestsFile, []);
ensure(responsesFile, {});

const readGuests = () => JSON.parse(fs.readFileSync(guestsFile, 'utf8'));
const readResponses = () => JSON.parse(fs.readFileSync(responsesFile, 'utf8'));
const writeResponses = (data) => fs.writeFileSync(responsesFile, JSON.stringify(data, null, 2));
const normalizePhone = (v = '') => String(v).replace(/\D/g, '');

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/guests', (req, res) => {
  const first = String(req.query.first || '').trim().toLowerCase();
  const last = String(req.query.last || '').trim().toLowerCase();
  const phone = normalizePhone(req.query.phone || '');
  const guests = readGuests();
  const responses = readResponses();

  const matches = guests.filter((g) => {
    const gf = String(g.firstName || '').toLowerCase();
    const gl = String(g.lastName || '').toLowerCase();
    const gn = String(g.name || '').toLowerCase();
    const gp = normalizePhone(g.phone || '');
    if (phone) return gp.includes(phone);
    const firstOk = !first || gf.includes(first) || gn.includes(first);
    const lastOk = !last || gl.includes(last) || gn.includes(last);
    return firstOk && lastOk;
  }).map((g) => ({ ...g, response: responses[g.id] || null }));

  res.json(matches);
});

app.post('/api/rsvp/:guestId', (req, res) => {
  const guests = readGuests();
  const guest = guests.find((g) => g.id === req.params.guestId);
  if (!guest) return res.status(404).json({ error: 'Guest not found' });

  const attending = req.body?.attending;
  const attendees = Number(req.body?.attendees || 0);
  const note = String(req.body?.note || '');

  if (!['yes', 'no'].includes(attending)) return res.status(400).json({ error: 'Choose yes or no' });
  if (attending === 'yes' && (attendees < 1 || attendees > Number(guest.invites || 0))) {
    return res.status(400).json({ error: 'Attendee count exceeds allowed seats' });
  }

  const responses = readResponses();
  responses[guest.id] = {
    attending,
    attendees: attending === 'yes' ? attendees : 0,
    note,
    updatedAt: new Date().toISOString()
  };
  writeResponses(responses);
  res.json({ ok: true });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`RSVP app listening on http://localhost:${PORT}`);
});
