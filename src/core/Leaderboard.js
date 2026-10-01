// Leaderboard via een abstractielaag. Nu: localStorage. Later kun je een
// externe dienst aansluiten door een provider met dezelfde methoden te maken
// (zie README → "Extern leaderboard") en die hieronder te kiezen.

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

/* Voorbeeld voor later (Supabase REST):
export class SupabaseProvider {
  constructor(url, anonKey) { this.url = url; this.key = anonKey; }
  async submit(entry) {
    await fetch(`${this.url}/rest/v1/leaderboard`, {
      method: 'POST',
      headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  }
  async top(limit = 10) {
    const r = await fetch(`${this.url}/rest/v1/leaderboard?select=*&order=score.desc,timeMs.asc&limit=${limit}`, {
      headers: { apikey: this.key, Authorization: `Bearer ${this.key}` },
    });
    return r.json();
  }
}
*/

function compare(a, b) { return b.score - a.score || a.timeMs - b.timeMs; }

class LeaderboardService {
  constructor(provider) { this.provider = provider; }
  setProvider(p) { this.provider = p; }
  async submit(entry) {
    const clean = {
      name: String(entry.name || 'Anoniem').slice(0, 20),
      score: Math.round(entry.score) || 0,
      timeMs: Math.round(entry.timeMs) || 0,
      date: new Date().toISOString(),
    };
    try { await this.provider.submit(clean); } catch (e) { console.warn('Leaderboard submit faalde', e); }
    return clean;
  }
  async top(limit = 10) {
    try { return await this.provider.top(limit); } catch (e) { console.warn('Leaderboard laden faalde', e); return []; }
  }
}

export const Leaderboard = new LeaderboardService(new LocalStorageProvider());

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
