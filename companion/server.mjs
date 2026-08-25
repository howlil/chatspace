import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

const HOST = '127.0.0.1';
const PORT = Number.parseInt(process.env.CHATSPACE_BRIDGE_PORT ?? '27123', 10);
const TOKEN = process.env.CHATSPACE_BRIDGE_TOKEN ?? '';
const VAULT_DIR = process.env.CHATSPACE_VAULT_DIR ?? '';
const MAX_BODY_BYTES = 1024 * 1024;

if (TOKEN.length < 16) {
  throw new Error('CHATSPACE_BRIDGE_TOKEN must contain at least 16 characters.');
}
if (VAULT_DIR === '') {
  throw new Error('CHATSPACE_VAULT_DIR is required.');
}

const noteRoot = path.resolve(VAULT_DIR, 'Chatspace');
await mkdir(noteRoot, { recursive: true });

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function sendJson(response, status, payload) {
  setCors(response);
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function isAuthorized(request) {
  return request.headers.authorization === `Bearer ${TOKEN}`;
}

function safeSegment(value, fallback) {
  const normalized = String(value)
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 80);
  return normalized === '' ? fallback : normalized;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Request body is too large.');
    }
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validNotePayload(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.markdown === 'string'
  );
}

const server = createServer(async (request, response) => {
  setCors(response);
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }
  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: 'unauthorized' });
    return;
  }

  const requestUrl = new URL(request.url ?? '/', `http://${HOST}:${PORT}`);
  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }
  if (request.method === 'POST' && requestUrl.pathname === '/notes') {
    try {
      const payload = await readJsonBody(request);
      if (!validNotePayload(payload)) {
        sendJson(response, 400, { error: 'invalid_note' });
        return;
      }
      const title = safeSegment(payload.title, 'Untitled');
      const id = safeSegment(payload.id, 'note');
      const filename = `${title}-${id}.md`;
      const target = path.resolve(noteRoot, filename);
      if (!target.startsWith(`${noteRoot}${path.sep}`)) {
        sendJson(response, 400, { error: 'invalid_path' });
        return;
      }
      await writeFile(target, payload.markdown, { encoding: 'utf8' });
      sendJson(response, 200, { path: path.posix.join('Chatspace', filename) });
      return;
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : 'invalid_request',
      });
      return;
    }
  }
  sendJson(response, 404, { error: 'not_found' });
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Chatspace bridge listening on http://${HOST}:${PORT}\n`);
});
