import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
export class Store {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, time TEXT NOT NULL, kind TEXT NOT NULL, detail TEXT NOT NULL);');
    for (const run of this.list()) {
      if (['queued', 'running'].includes(run.status)) {
        this.patch(run.id, { status: 'needs_human', error: 'PROCESS_RESTARTED', completedAt: new Date().toISOString() });
        this.event(run.id, 'interrupted', { reason: 'PROCESS_RESTARTED' });
      }
    }
  }
  create(agentId, targetId, prompt) {
    const id = randomUUID();
    const run = { id, packageId: 'AUTH-' + id, agentId, targetId, prompt, status: 'awaiting_approval', createdAt: new Date().toISOString(), output: null, error: null, usage: [], resolution: null };
    this.db.prepare('INSERT INTO runs VALUES (?,?)').run(id, JSON.stringify(run));
    this.event(id, 'approval_requested', { packageId: run.packageId, agentId, targetId });
    return run;
  }
  get(id) { const row = this.db.prepare('SELECT body FROM runs WHERE id=?').get(id); return row ? JSON.parse(row.body) : null; }
  list() { return this.db.prepare('SELECT body FROM runs ORDER BY rowid DESC').all().map(row => JSON.parse(row.body)); }
  patch(id, patch) { const run = { ...this.get(id), ...patch }; this.db.prepare('UPDATE runs SET body=? WHERE id=?').run(JSON.stringify(run), id); return run; }
  event(id, kind, detail = {}) { this.db.prepare('INSERT INTO events(run_id,time,kind,detail) VALUES (?,?,?,?)').run(id, new Date().toISOString(), kind, JSON.stringify(detail)); }
  events(id) { return this.db.prepare('SELECT seq,time,kind,detail FROM events WHERE run_id=? ORDER BY seq').all(id).map(row => ({ ...row, detail: JSON.parse(row.detail) })); }
  close() { this.db.close(); }
}
