import http from 'node:http';
import { readFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { Store } from './store.mjs';
import { Engine, configFromEnv } from './engine.mjs';
import { agents, cases } from './domain.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
export function createApp({ dbPath = resolve(here, '.data/runs.sqlite'), config = configFromEnv(), fetcher = fetch } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
  const store = new Store(dbPath), engine = new Engine(store, config, fetcher), token = randomBytes(32).toString('hex');
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    const send = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    try {
      const expected = '127.0.0.1:' + server.address().port;
      if (req.headers.host !== expected && req.headers.host !== 'localhost:' + server.address().port) return send(403, { error: 'LOCAL_HOST_ONLY' });
      if (req.headers.origin && !['http://' + expected, 'http://localhost:' + server.address().port].includes(req.headers.origin)) return send(403, { error: 'ORIGIN_REJECTED' });
      const url = new URL(req.url, 'http://' + expected);
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && (req.headers['x-runtime-token'] !== token || req.headers['content-type'] !== 'application/json')) return send(403, { error: 'LOCAL_SESSION_REQUIRED' });
        if (req.method === 'GET' && url.pathname === '/api/bootstrap') return send(200, { token, configured: config.configured, model: config.model || null, agents, cases, limits: { maxRounds: config.maxRounds, maxCalls: config.maxCalls, concurrency: 1 } });
        if (req.method === 'GET' && url.pathname === '/api/runs') return send(200, store.list());
        const match = url.pathname.match(/^\/api\/runs\/([a-f0-9-]+)(?:\/(approve|cancel|resolve))?$/);
        if (req.method === 'GET' && match && !match[2]) {
          const run = store.get(match[1]);
          return run ? send(200, { run, events: store.events(run.id) }) : send(404, { error: 'NOT_FOUND' });
        }
        if (req.method !== 'POST') return send(404, { error: 'NOT_FOUND' });
        let body = '';
        for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 16384) return send(413, { error: 'BODY_TOO_LARGE' }); }
        let data;
        try { data = JSON.parse(body); } catch { return send(400, { error: 'INVALID_JSON' }); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) return send(400, { error: 'INVALID_BODY' });
        if (url.pathname === '/api/runs') {
          if (!Object.hasOwn(agents, data.agentId) || typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 2000 || typeof data.targetId !== 'string') return send(400, { error: 'INVALID_TASK' });
          const target = data.agentId === 'investigator' ? cases.find(c => c.id === data.targetId) : store.get(data.targetId);
          if (!target || (data.agentId !== 'investigator' && !['succeeded', 'needs_human', 'cancelled'].includes(target.status))) return send(400, { error: 'INVALID_TARGET' });
          if (store.list().filter(r => ['awaiting_approval', 'queued', 'running'].includes(r.status)).length >= 30) return send(429, { error: 'TOO_MANY_PENDING_RUNS' });
          return send(201, store.create(data.agentId, data.targetId, data.prompt.trim()));
        }
        if (match && match[2]) {
          const run = store.get(match[1]);
          if (!run) return send(404, { error: 'NOT_FOUND' });
          if (match[2] === 'approve') engine.approve(run.id, data.packageId);
          if (match[2] === 'cancel') engine.cancel(run.id);
          if (match[2] === 'resolve') {
            if (!['succeeded', 'needs_human'].includes(run.status) || run.resolution || !['keep_hold', 'release', 'manual_review'].includes(data.decision) || typeof data.note !== 'string' || !data.note.trim() || data.note.length > 1000) return send(409, { error: 'INVALID_RESOLUTION' });
            const resolution = { decision: data.decision, note: data.note.trim(), actor: 'local_user', time: new Date().toISOString(), scope: 'local_simulation_only' };
            store.patch(run.id, { resolution });
            store.event(run.id, 'human_resolution', resolution);
          }
          return send(200, store.get(run.id));
        }
        return send(404, { error: 'NOT_FOUND' });
      }
      if (req.method !== 'GET') return send(405, { error: 'METHOD_NOT_ALLOWED' });
      const isPrototype = url.pathname.startsWith('/prototype/');
      const root = isPrototype ? resolve(here, '../prototype') : resolve(here, 'public');
      const relative = isPrototype ? url.pathname.slice('/prototype/'.length) : url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      let path;
      try { path = realpathSync(resolve(root, decodeURIComponent(relative))); } catch { return send(404, { error: 'NOT_FOUND' }); }
      if (!path.startsWith(root + sep) || !mime[extname(path)]) return send(404, { error: 'NOT_FOUND' });
      const bytes = readFileSync(path);
      if (!isPrototype) res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
      res.writeHead(200, { 'Content-Type': mime[extname(path)] });
      res.end(bytes);
    } catch (error) {
      const safe = ['INVALID_APPROVAL', 'MODEL_NOT_CONFIGURED', 'INVALID_CANCEL'];
      send(safe.includes(error.message) ? 409 : 500, { error: safe.includes(error.message) ? error.message : 'INTERNAL_ERROR' });
    }
  });
  server.requestTimeout = 10000;
  return { server, store, engine, close: async () => { await engine.stop(); await new Promise(resolve => server.close(resolve)); store.close(); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp(), port = Number(process.env.PORT || 4317);
  app.server.listen(port, '127.0.0.1', () => console.log('Local risk agents: http://127.0.0.1:' + app.server.address().port));
  let closing = false;
  for (const name of ['SIGINT', 'SIGTERM']) process.on(name, async () => { if (!closing) { closing = true; await app.close(); process.exit(0); } });
}
