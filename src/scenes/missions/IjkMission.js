// Missie IJk: deel 1 koppelingspuzzel (buizen draaien zodat databronnen het HR-systeem bereiken),
// deel 2 loonrun (afwijkingen t.o.v. de cao-kaart eruit pikken).
import Phaser from 'phaser';
import { MissionBase } from './MissionBase.js';
import { P, HEX, textStyle, titleStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst, shake, floatText, wobble } from '../../core/Juice.js';
import { panel, card, button, bake } from '../../ui/widgets.js';
import { makeTexture, rrect, circle, style } from '../../gfx/draw.js';

const N = 1, E = 2, S = 4, W = 8;
const rot = (m) => ((m << 1) | (m >> 3)) & 15;
const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
const CANON = { end: 1, straight: 5, corner: 3, tee: 7, cross: 15 };
const FLOW = 0x4fd1ff, IDLE = 0xb9bccb;
const CELL = 84;
const SRC_ICONS = { time: 'clock', leave: 'weekend', contracts: 'notebook' };

function pieceOf(mask) {
  for (const [name, c] of Object.entries(CANON)) {
    let m = c;
    for (let r = 0; r < 4; r++) { if (m === mask) return { name, r }; m = rot(m); }
  }
  return { name: 'cross', r: 0 };
}

function makePipeTextures(scene) {
  if (scene.textures.exists('pipe_straight')) return;
  makeTexture(scene, 'pipe_bg', CELL, CELL, (c) => {
    rrect(c, 3, 3, CELL - 6, CELL - 6, 12); style(c, { fill: '#1d3557', stroke: '#0e1f33', lw: 3 });
    c.fillStyle = 'rgba(255,255,255,0.05)'; rrect(c, 8, 8, CELL - 16, 12, 6); c.fill();
  });
  const seg = (c, dir) => {
    const h = CELL / 2;
    const ends = { N: [h, 0], E: [CELL, h], S: [h, CELL], W: [0, h] };
    const [x, y] = ends[dir];
    c.beginPath(); c.moveTo(h, h); c.lineTo(x, y);
  };
  const draw = (key, dirs) => makeTexture(scene, key, CELL, CELL, (c) => {
    c.lineCap = 'butt';
    for (const pass of [[P.ink, 30], ['#ffffff', 20]]) {
      for (const d of dirs) { seg(c, d); c.strokeStyle = pass[0]; c.lineWidth = pass[1]; c.stroke(); }
      circle(c, CELL / 2, CELL / 2, pass[1] / 2); c.fillStyle = pass[0]; c.fill();
    }
    // klinknagels
    for (const d of dirs) {
      const p = { N: [CELL / 2, 6], E: [CELL - 6, CELL / 2], S: [CELL / 2, CELL - 6], W: [6, CELL / 2] }[d];
      c.fillStyle = P.ink; c.fillRect(p[0] - (d === 'N' || d === 'S' ? 16 : 3), p[1] - (d === 'E' || d === 'W' ? 16 : 3), d === 'N' || d === 'S' ? 32 : 6, d === 'E' || d === 'W' ? 32 : 6);
    }
  });
  makeTexture(scene, 'belt', 64, 36, (c) => {
    c.fillStyle = '#3b3f55'; c.fillRect(0, 0, 64, 36);
    c.fillStyle = '#565b78'; for (let x = -36; x < 64; x += 16) { c.beginPath(); c.moveTo(x, 36); c.lineTo(x + 8, 36); c.lineTo(x + 44, 0); c.lineTo(x + 36, 0); c.closePath(); c.fill(); }
  });
  draw('pipe_end', ['N']);
  draw('pipe_straight', ['N', 'S']);
  draw('pipe_corner', ['N', 'E']);
  draw('pipe_tee', ['N', 'E', 'S']);
  draw('pipe_cross', ['N', 'E', 'S', 'W']);
}

const SCALES = { A: 14.0, B: 16.5, C: 19.25 };
const euro = (v) => `€${v.toFixed(2).replace('.', ',')}`;

export class IjkMission extends MissionBase {
  constructor() { super('IjkMission', 'ijk', { timeLimit: 210, thresholds: [400, 850, 1200] }); }

  drawBackground() {
    super.drawBackground();
    const { width, height } = this.scale;
    // technische ruimte: buizen langs de wand
    const g = this.add.graphics().setDepth(-90);
    g.fillStyle(0x0e2a44, 0.35).fillRect(0, 80, width, height - 80);
    g.lineStyle(14, 0x3d6b8a, 0.5);
    for (const y of [120, 690]) g.lineBetween(0, y, width, y);
    for (const x of [30, width - 30]) g.lineBetween(x, 80, x, height);
    bake(this, g, 'ijk_pipes_bg', 0, 0, width, height);
  }

  startGame() {
    makePipeTextures(this);
    this.levelIdx = 0;
    this.levels = [
      { w: 5, h: 4, sources: [0, 3], target: 1, keys: ['time', 'leave'] },
      { w: 7, h: 5, sources: [0, 2, 4], target: 2, keys: ['time', 'leave', 'contracts'] },
    ];
    this.startLevel();
  }

  // ── Deel 1: koppelingspuzzel ─────────────────────────────────────────
  generate(L) {
    const { w, h } = L;
    const sol = Array.from({ length: h }, () => Array(w).fill(0));
    const inNet = Array.from({ length: h }, () => Array(w).fill(false));
    const tx = w - 1, ty = L.target;
    inNet[ty][tx] = true;
    sol[ty][tx] |= E;
    for (const sy of L.sources) {
      sol[sy][0] |= W;
      if (inNet[sy][0]) continue;
      // Dijkstra met willekeurige kosten naar het bestaande netwerk
      const cost = Array.from({ length: h }, () => Array.from({ length: w }, () => 1 + Math.random() * 4));
      const dist = Array.from({ length: h }, () => Array(w).fill(Infinity));
      const prev = Array.from({ length: h }, () => Array(w).fill(null));
      dist[sy][0] = 0;
      const open = [[0, sy]];
      let found = null;
      while (open.length) {
        open.sort((a, b) => dist[a[1]][a[0]] - dist[b[1]][b[0]]);
        const [x, y] = open.shift();
        if (inNet[y][x]) { found = [x, y]; break; }
        for (const [, dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nd = dist[y][x] + cost[ny][nx];
          if (nd < dist[ny][nx]) { dist[ny][nx] = nd; prev[ny][nx] = [x, y]; open.push([nx, ny]); }
        }
      }
      let cur = found;
      while (cur && prev[cur[1]][cur[0]]) {
        const [x, y] = cur, [px, py] = prev[y][x];
        const d = DIRS.find(([, dx, dy]) => px + dx === x && py + dy === y);
        sol[py][px] |= d[0];
        sol[y][x] |= d[3];
        inNet[py][px] = true; inNet[y][x] = true;
        cur = [px, py];
      }
      inNet[sy][0] = true;
    }
    // vul de rest met losse stukken
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!sol[y][x]) {
        let m = Phaser.Utils.Array.GetRandom([5, 3, 3, 7]);
        for (let r = Phaser.Math.Between(0, 3); r > 0; r--) m = rot(m);
        sol[y][x] = m;
      }
    }
    return { sol, inNet };
  }

  startLevel() {
    const L = this.levels[this.levelIdx];
    const { width } = this.scale;
    const { sol, inNet } = this.generate(L);
    this.L = L; this.sol = sol; this.inNet = inNet;
    this.moves = 0;
    this.board = this.add.container(0, 0).setDepth(10);
    const bw = L.w * CELL, bh = L.h * CELL;
    const ox = width / 2 - bw / 2 + 20, oy = 420 - bh / 2;
    this.ox = ox; this.oy = oy;
    this.board.add(this.add.text(width / 2, 120, `${this.T('part1')} — ${this.T('level', { n: this.levelIdx + 1 })}`, textStyle(28, P.cream, { stroke: P.ink, strokeThickness: 6 })).setOrigin(0.5));
    this.board.add(this.add.rectangle(ox + bw / 2, oy + bh / 2, bw + 24, bh + 24, 0x0e1f33).setStrokeStyle(5, HEX.ink));
    this.cells = [];
    let minMoves = 0;
    for (let y = 0; y < L.h; y++) {
      this.cells.push([]);
      for (let x = 0; x < L.w; x++) {
        let m = sol[y][x];
        const spins = inNet[y][x] ? Phaser.Math.Between(1, 3) : Phaser.Math.Between(0, 3);
        for (let r = 0; r < spins; r++) m = rot(m);
        // minimale draaien voor netwerkcellen
        if (inNet[y][x]) {
          let k = 0, t = m;
          while (t !== sol[y][x] && k < 4) { t = rot(t); k++; }
          minMoves += k;
        }
        const cx = ox + x * CELL + CELL / 2, cy = oy + y * CELL + CELL / 2;
        const bg = this.add.image(cx, cy, 'pipe_bg');
        const pc = pieceOf(m);
        const spr = this.add.image(cx, cy, `pipe_${pc.name}`).setAngle(pc.r * 90).setTint(IDLE);
        const cell = { x, y, m, spr, bg };
        bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.rotateCell(cell));
        this.board.add([bg, spr]);
        this.cells[y].push(cell);
        bg.setScale(0); spr.setScale(0);
        this.tweens.add({ targets: [bg, spr], scale: 1, delay: (x + y) * 35, duration: 250, ease: 'Back.Out' });
      }
    }
    this.minMoves = minMoves;
    // bronnen
    this.srcObjs = L.sources.map((sy, i) => {
      const y = oy + sy * CELL + CELL / 2;
      const c = this.add.container(ox - 70, y);
      c.add(this.add.rectangle(36, 0, 50, 18, FLOW).setStrokeStyle(4, HEX.ink));
      c.add(this.add.circle(0, 0, 40, 0xffffff).setStrokeStyle(4, HEX.ink));
      c.add(this.add.image(0, 0, 'icons', SRC_ICONS[L.keys[i]]).setDisplaySize(52, 52));
      c.add(this.add.text(-50, 0, this.T(`sources.${L.keys[i]}`), textStyle(17, P.cream, { stroke: P.ink, strokeThickness: 4, align: 'right' })).setOrigin(1, 0.5));
      this.board.add(c);
      return c;
    });
    const ty = oy + L.target * CELL + CELL / 2;
    const tgt = this.add.container(ox + bw + 70, ty);
    tgt.add(this.add.rectangle(-36, 0, 50, 18, IDLE).setStrokeStyle(4, HEX.ink));
    tgt.add(this.add.nineslice(0, 0, 'ui_card', undefined, 96, 110, 18, 18, 18, 18).setTint(0xeaf6ff));
    tgt.add(this.add.image(0, -12, 'icons', 'database').setDisplaySize(60, 60));
    tgt.add(this.add.text(0, 34, this.T('target'), textStyle(14, P.ink)).setOrigin(0.5));
    this.tgtPipe = tgt.list[0];
    this.tgt = tgt;
    this.board.add(tgt);
    this.solved = false;
    this.updateFlow();
  }

  rotateCell(cell) {
    if (!this.running || this.solved) return;
    cell.m = rot(cell.m);
    this.moves++;
    Audio.sfx('rotate');
    this.tweens.add({ targets: cell.spr, angle: cell.spr.angle + 90, duration: 110, ease: 'Quad.Out', onComplete: () => this.updateFlow() });
  }

  updateFlow() {
    const { w, h } = this.L;
    const flow = Array.from({ length: h }, () => Array(w).fill(false));
    const q = [];
    for (const sy of this.L.sources) if (this.cells[sy][0].m & W) { flow[sy][0] = true; q.push([0, sy]); }
    while (q.length) {
      const [x, y] = q.shift();
      const m = this.cells[y][x].m;
      for (const [bit, dx, dy, opp] of DIRS) {
        if (!(m & bit)) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || flow[ny][nx]) continue;
        if (this.cells[ny][nx].m & opp) { flow[ny][nx] = true; q.push([nx, ny]); }
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.cells[y][x].spr.setTint(flow[y][x] ? FLOW : IDLE);
    // alle bronnen verbonden met het doel?
    const tc = this.cells[this.L.target][w - 1];
    const reach = Array.from({ length: h }, () => Array(w).fill(false));
    let ok = false;
    if (tc.m & E) {
      const q2 = [[w - 1, this.L.target]]; reach[this.L.target][w - 1] = true;
      while (q2.length) {
        const [x, y] = q2.shift();
        const m = this.cells[y][x].m;
        for (const [bit, dx, dy, opp] of DIRS) {
          if (!(m & bit)) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || reach[ny][nx]) continue;
          if (this.cells[ny][nx].m & opp) { reach[ny][nx] = true; q2.push([nx, ny]); }
        }
      }
      ok = this.L.sources.every((sy) => reach[sy][0] && (this.cells[sy][0].m & W));
    }
    this.tgtPipe.setFillStyle(ok ? FLOW : IDLE);
    if (ok && !this.solved) this.levelSolved(reach);
  }

  levelSolved(reach) {
    this.solved = true;
    Audio.sfx('flow');
    const extra = Math.max(0, this.moves - this.minMoves);
    const pts = 150 + Math.max(0, 150 - extra * 6);
    // stroom-animatie langs de buizen
    let i = 0;
    for (let y = 0; y < this.L.h; y++) for (let x = 0; x < this.L.w; x++) {
      if (!reach[y][x]) continue;
      const c = this.cells[y][x];
      this.time.delayedCall((x + Math.abs(y - this.L.target)) * 60, () => {
        burst(this, c.spr.x, c.spr.y, 'splash', 4, { tint: [FLOW, 0xffffff] });
        this.tweens.add({ targets: c.spr, scale: 1.15, duration: 120, yoyo: true });
      });
      i++;
    }
    this.time.delayedCall(700, () => {
      this.addScore(pts, this.tgt.x, this.tgt.y - 70);
      floatText(this, 640, 220, this.T('connected'), P.cream, 40);
      burst(this, this.tgt.x, this.tgt.y, 'stars', 24);
    });
    this.time.delayedCall(1900, () => {
      this.tweens.add({
        targets: this.board, alpha: 0, duration: 300, onComplete: () => {
          this.board.destroy();
          this.levelIdx++;
          if (this.levelIdx < this.levels.length) this.startLevel();
          else this.startPart2Intro();
        },
      });
    });
  }

  // ── Deel 2: loonrun ──────────────────────────────────────────────────
  startPart2Intro() {
    this.timerPaused = true;
    const items = this.T('howTo').slice(2);
    this.showHowTo(this.T('part2'), items, () => { this.timerPaused = false; this.startPart2(); });
  }

  startPart2() {
    const { width, height } = this.scale;
    this.slipIdx = 0;
    this.slipCount = 10;
    this.names = Phaser.Utils.Array.Shuffle(this.T('names').slice());
    // cao-kaart
    const cao = this.add.container(220, 410).setDepth(10);
    cao.add(panel(this, 0, 0, 340, 400));
    cao.add(this.add.image(-120, -150, 'icons', 'notebook').setDisplaySize(50, 50));
    cao.add(this.add.text(-85, -150, this.T('cao'), textStyle(30, P.ink)).setOrigin(0, 0.5));
    let y = -80;
    for (const [s, v] of Object.entries(SCALES)) {
      cao.add(this.add.text(-140, y, this.T('caoScale', { s, loon: v.toFixed(2).replace('.', ',') }), textStyle(21, P.ink)).setOrigin(0, 0.5));
      y += 46;
    }
    y += 10;
    cao.add(this.add.text(-140, y, this.T('caoMax', { uren: 40 }), textStyle(21, P.ink)).setOrigin(0, 0.5)); y += 46;
    cao.add(this.add.text(-140, y, this.T('caoBonus', { pct: 25 }), textStyle(21, P.ink)).setOrigin(0, 0.5));
    cao.x = -300;
    this.tweens.add({ targets: cao, x: 220, duration: 400, ease: 'Back.Out' });
    // lopende band
    this.belt = this.add.tileSprite(780, 650, 760, 36, 'belt').setDepth(5);
    this.add.rectangle(780, 650, 770, 46).setStrokeStyle(5, HEX.ink).setDepth(6);
    this.okBtn = button(this, 780, 640, this.T('allOk'), () => this.judge(null), { width: 260, color: HEX.green, icon: 'check' }).setDepth(30);
    this.counter = this.add.text(width - 40, 120, '', textStyle(24, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(1, 0.5).setDepth(30);
    void height;
    this.nextSlip();
  }

  makeSlipData() {
    const scale = Phaser.Utils.Array.GetRandom(Object.keys(SCALES));
    const d = { name: this.names.pop() || 'J. Jansen', scale, wage: SCALES[scale], hours: Phaser.Math.Between(24, 40), bonus: 25, error: null };
    if (Math.random() < 0.6) {
      d.error = Phaser.Utils.Array.GetRandom(['wage', 'hours', 'bonus']);
      if (d.error === 'wage') { const others = Object.keys(SCALES).filter((s) => s !== scale); d.wage = Math.random() < 0.6 ? SCALES[Phaser.Utils.Array.GetRandom(others)] : d.wage - 1.25; }
      if (d.error === 'hours') d.hours = Phaser.Math.Between(42, 48);
      if (d.error === 'bonus') d.bonus = Phaser.Utils.Array.GetRandom([10, 15, 20, 30]);
    }
    return d;
  }

  nextSlip() {
    if (this.slipIdx >= this.slipCount) return this.endPart2();
    this.slipIdx++;
    this.counter.setText(`${this.slipIdx} / ${this.slipCount}`);
    const d = this.makeSlipData();
    this.slipData = d;
    const s = this.add.container(1500, 380).setDepth(20);
    s.add(card(this, 0, 0, 520, 380, 0xffffff));
    s.add(this.add.rectangle(0, -160, 500, 46, this.brand.color).setStrokeStyle(3, HEX.ink));
    s.add(this.add.image(-225, -160, 'icons', 'payslip').setDisplaySize(40, 40));
    s.add(this.add.text(-195, -160, `Loonstrook · ${d.name}`, textStyle(22, P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0, 0.5));
    const fields = [
      ['scale', this.T('fieldScale'), d.scale],
      ['wage', this.T('fieldWage'), euro(d.wage)],
      ['hours', this.T('fieldHours'), `${d.hours}`],
      ['bonus', this.T('fieldBonus'), `${d.bonus}%`],
    ];
    this.fieldObjs = {};
    fields.forEach(([key, label, val], i) => {
      const fy = -95 + i * 66;
      const row = this.add.container(0, fy);
      const bg = this.add.nineslice(0, 0, 'ui_card', undefined, 470, 58, 18, 18, 18, 18).setTint(0xf3f6ff);
      const l = this.add.text(-215, 0, label, textStyle(22, P.inkSoft)).setOrigin(0, 0.5);
      const v = this.add.text(215, 0, val, textStyle(26, P.ink)).setOrigin(1, 0.5);
      row.add([bg, l, v]);
      row.setSize(470, 58).setInteractive({ useHandCursor: true });
      row.on('pointerover', () => bg.setTint(0xfff3c4));
      row.on('pointerout', () => bg.setTint(0xf3f6ff));
      row.on('pointerup', () => this.judge(key));
      row.bg = bg;
      s.add(row);
      this.fieldObjs[key] = row;
    });
    this.slip = s;
    this.judging = false;
    this.tweens.add({ targets: s, x: 780, duration: 450, ease: 'Back.Out' });
    this.tweens.add({ targets: this.belt, tilePositionX: '-=300', duration: 450 });
  }

  judge(field) {
    if (!this.running || this.judging || !this.slip) return;
    this.judging = true;
    const d = this.slipData;
    const correctField = d.error === 'wage' ? ['wage', 'scale'] : d.error ? [d.error] : [];
    let good;
    if (field === null) good = !d.error;
    else good = correctField.includes(field);
    const s = this.slip;
    if (good) {
      const pts = d.error ? 80 : 50;
      this.addScore(pts, 1010, 190);
      Audio.sfx('good');
      floatText(this, 780, 150, d.error ? this.T('correct') : this.T('allOk'), P.green, 28);
      burst(this, 780, 380, 'stars', 14);
    } else {
      this.addScore(-30, 1010, 190);
      Audio.sfx('error'); shake(this, 0.006, 150);
      floatText(this, 780, 150, d.error ? this.T('missed') : this.T('falseAlarm'), P.red, 26);
      wobble(this, s);
    }
    // laat de fout zien
    if (d.error) {
      const row = this.fieldObjs[d.error];
      row.bg.setTint(0xffc9c9);
      const mark = this.add.image(250, 0, 'icons', 'cross').setDisplaySize(34, 34);
      row.add(mark);
    }
    const stamp = this.add.image(140, 120, 'icons', good ? 'check' : 'cross').setDisplaySize(110, 110).setAngle(-14).setAlpha(0);
    s.add(stamp);
    this.tweens.add({ targets: stamp, alpha: 1, scale: { from: stamp.scale * 2, to: stamp.scale }, duration: 200, ease: 'Back.Out' });
    this.time.delayedCall(d.error ? 1100 : 700, () => {
      this.tweens.add({ targets: s, x: -400, duration: 380, ease: 'Cubic.In', onComplete: () => s.destroy() });
      this.tweens.add({ targets: this.belt, tilePositionX: '-=300', duration: 380 });
      this.slip = null;
      this.time.delayedCall(250, () => this.nextSlip());
    });
  }

  endPart2() {
    this.running = false;
    floatText(this, 640, 300, this.T('payslipsDone'), P.cream, 46);
    Audio.sfx('fanfare');
    const tb = Math.round(Math.max(0, this.timeLeft) * 1.5);
    if (tb) this.time.delayedCall(600, () => this.addScore(tb, 640, 360, `Tijdbonus +${tb}`));
    this.time.delayedCall(1600, () => this.finish());
  }
}
