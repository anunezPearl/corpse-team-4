// Zero-dependency local dev server + OpenAI proxy.
// Keeps the API key server-side so it never reaches the browser or the repo.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;

// The four DSCH-motif hearings. Difficulty escalates; each clean pass plays
// one note of Shostakovich's D-Es-C-H musical signature.
const HEARINGS = [
  {
    name: 'The Rehearsal',
    seconds: 26,
    note: 293.66, // D4
    instruction:
      'Write ONE short, gentle tongue twister (8 to 12 words) using mostly ' +
      'words that start with the letter "{L}". Keep the sounds soft and easy ' +
      'to say. Exactly one word in the twister must be a real German word of ' +
      'at least 6 syllables. Return only the twister text, no quotes, no preamble.',
  },
  {
    name: 'The House Committee',
    seconds: 22,
    note: 311.13, // D#4 / Eb4
    instruction:
      'Write ONE tongue twister (10 to 14 words) using mostly words starting ' +
      'with the letter "{L}". Make it moderately tricky, with a couple of ' +
      'repeated syllables. Exactly one word in the twister must be a real German ' +
      'word of at least 6 syllables. Return only the twister text, no quotes, no preamble.',
  },
  {
    name: 'The Congress Hears You',
    seconds: 19,
    note: 261.63, // C4
    instruction:
      'Write ONE tricky tongue twister (12 to 16 words) using mostly words ' +
      'starting with the letter "{L}", stacking similar-sounding syllables ' +
      'that are easy to trip over. Exactly one word in the twister must be a ' +
      'real German word of at least 6 syllables. Return only the twister text, no quotes, no preamble.',
  },
  {
    name: 'Muddle Instead of Music',
    seconds: 16,
    note: 246.94, // B3 (H in German notation)
    instruction:
      'Write ONE brutally difficult tongue twister (14 to 20 words) using ' +
      'mostly words starting with the letter "{L}". Stack plosives and ' +
      'consonant clusters, and alternate near-identical syllables, to make it ' +
      'maximally hard to say quickly. Exactly one word in the twister must be a ' +
      'real German word of at least 6 syllables. Return only the twister text, no quotes, no preamble.',
  },
];

function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const localEnv = loadEnvLocal();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || localEnv.OPENAI_API_KEY;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function handleTwister(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'invalid JSON body' });
    return;
  }

  const { letter, hearingIndex } = body;
  if (typeof letter !== 'string' || !/^[a-zA-Z]$/.test(letter)) {
    sendJson(res, 400, { error: 'letter must be a single A-Z character' });
    return;
  }
  const hearing = HEARINGS[hearingIndex];
  if (!hearing) {
    sendJson(res, 400, { error: 'invalid hearingIndex' });
    return;
  }
  if (!OPENAI_API_KEY) {
    sendJson(res, 500, { error: 'OPENAI_API_KEY not configured. Add it to .env.local (see .env.example).' });
    return;
  }

  const prompt = hearing.instruction.replaceAll('{L}', letter.toUpperCase());

  let upstream;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80,
        temperature: 1,
      }),
    });
  } catch (err) {
    sendJson(res, 502, { error: `could not reach OpenAI: ${err.message}` });
    return;
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    sendJson(res, upstream.status, { error: (data.error && data.error.message) || 'upstream error' });
    return;
  }

  const raw = data.choices?.[0]?.message?.content || '';
  const text = raw.trim().replace(/^"|"$/g, '');
  sendJson(res, 200, { text });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = fs.readFileSync(path.join(__dirname, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && req.url === '/api/hearings') {
      sendJson(
        res,
        200,
        HEARINGS.map(({ name, seconds, note }) => ({ name, seconds, note }))
      );
      return;
    }

    if (req.method === 'POST' && req.url === '/api/twister') {
      await handleTwister(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    sendJson(res, 500, { error: String(err && err.message ? err.message : err) });
  }
});

server.listen(PORT, () => {
  console.log(`Comrade Composer server running: http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) {
    console.log('WARNING: no OPENAI_API_KEY found. Add one to .env.local (see .env.example).');
  }
});
