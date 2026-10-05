// Leaderboard via een abstractielaag. Met Supabase ingevuld in src/config/leaderboard.js
// is het een gedeeld leaderboard voor iedereen; zonder (of zonder internet) valt het
// terug op de scores op het eigen apparaat. Mislukte inzendingen worden later opnieuw
// verstuurd.
import { LEADERBOARD } from '../config/leaderboard.js';

/**
 * @typedef {{ name: string, score: number, timeMs: number, date: string }} Entry
 * Een provider implementeert:
 *   async submit(entry: Entry): Promise<void>
 *   async top(limit: number): Promise<Entry[]>
 */

const KEY = 'ppz.leaderboard.v1';

export class LocalStorageProvider {
  _read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  async submit(entry) {
    const list = this._read();
    list.push(entry);
    list.sort(compare);
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100))); } catch { /* vol of privé */ }
  }
  async top(limit = 10) { return this._read().sort(compare).slice(0, limit); }
}

/** Supabase (PostgREST) — tabel: zie docs/supabase.sql. */
export class SupabaseProvider {
  constructor(url, anonKey, table = 'leaderboard') {
    this.base = `${url.replace(/\/+$/, '')}/rest/v1/${table}`;
    this.key = anonKey;
  }
  async _fetch(query, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const r = await fetch(this.base + query, {
        ...opts,
        signal: ctrl.signal,
        headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
      return r;
    } finally { clearTimeout(timer); }
  }
  async submit(entry) {
    await this._fetch('', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(entry) });
  }
  async top(limit = 10) {
    const r = await this._fetch(`?select=name,score,timeMs,date&order=score.desc,timeMs.asc&limit=${limit}`);
    return r.json();
  }
}

function compare(a, b) { return b.score - a.score || a.timeMs - b.timeMs; }

/** Is dit dezelfde inzending? (Supabase geeft de datum in een ander formaat terug.) */
export function sameEntry(a, b) {
  return !!a && !!b && a.name === b.name && Math.abs(new Date(a.date) - new Date(b.date)) < 2;
}

const PENDING = 'ppz.leaderboard.pending.v1';
const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING)) || []; } catch { return []; } };
const writePending = (list) => { try { localStorage.setItem(PENDING, JSON.stringify(list.slice(-20))); } catch { /* privé */ } };

class LeaderboardService {
  constructor(local, remote = null) {
    this.local = local;
    this.remote = remote;
    /** 'online' = gedeeld leaderboard, 'local' = alleen dit apparaat. */
    this.lastSource = remote ? 'online' : 'local';
  }
  setProvider(p) { this.remote = p; }
  get shared() { return !!this.remote; }

  async submit(entry) {
    const clean = {
      name: String(entry.name || '').trim().slice(0, 20) || 'Anoniem',
      score: Math.min(20000, Math.max(0, Math.round(entry.score) || 0)),
      timeMs: Math.min(36000000, Math.max(0, Math.round(entry.timeMs) || 0)),
      date: new Date().toISOString(),
    };
    try { await this.local.submit(clean); } catch (e) { console.warn('Lokaal opslaan faalde', e); }
    if (this.remote) {
      try {
        await this.flush();
        await this.remote.submit(clean);
        this.lastSource = 'online';
      } catch (e) {
        console.warn('Online leaderboard niet bereikbaar; score wordt later verstuurd', e);
        writePending([...readPending(), clean]);
        this.lastSource = 'local';
      }
    }
    return clean;
  }

  async top(limit = 10) {
    if (this.remote) {
      try {
        await this.flush();
        const list = await this.remote.top(limit);
        this.lastSource = 'online';
        return list;
      } catch (e) {
        console.warn('Online leaderboard laden faalde; toon lokale scores', e);
        this.lastSource = 'local';
      }
    }
    try { return await this.local.top(limit); } catch { return []; }
  }

  /** Verstuur scores die eerder (zonder internet) niet aankwamen. */
  async flush() {
    const pending = readPending();
    if (!pending.length || !this.remote) return;
    const left = [];
    for (const e of pending) {
      try { await this.remote.submit(e); } catch { left.push(e); }
    }
    writePending(left);
    if (left.length === pending.length) throw new Error('nog offline');
  }
}

const remote = LEADERBOARD.supabaseUrl && LEADERBOARD.supabaseAnonKey
  ? new SupabaseProvider(LEADERBOARD.supabaseUrl, LEADERBOARD.supabaseAnonKey, LEADERBOARD.table)
  : null;
export const Leaderboard = new LeaderboardService(new LocalStorageProvider(), remote);

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
