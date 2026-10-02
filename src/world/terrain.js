// Tekent het parkterrein in chunks van 1024×1024 (canvas-textures).
import { P } from '../gfx/palette.js';
import { rng, smoothLine, circle, ellipse, rrect, makeTexture } from '../gfx/draw.js';
import { LAND, GRASS, PATHS, PLAZA, PIER, JETTIES, WORLD_W, WORLD_H } from './layout.js';

export const CHUNK = 1024;

function polyPath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function planks(ctx, x, y, w, h, vertical) {
  ctx.fillStyle = 'rgba(30,20,40,0.25)';
  ctx.fillRect(x + 6, y + 8, w, h);
  rrect(ctx, x, y, w, h, 4);
  ctx.fillStyle = P.woodLight; ctx.fill();
  ctx.strokeStyle = P.woodDark; ctx.lineWidth = 2;
  if (vertical) for (let yy = y + 16; yy < y + h; yy += 16) { ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy); ctx.stroke(); }
  else for (let xx = x + 16; xx < x + w; xx += 16) { ctx.beginPath(); ctx.moveTo(xx, y + 2); ctx.lineTo(xx, y + h - 2); ctx.stroke(); }
  rrect(ctx, x, y, w, h, 4); ctx.strokeStyle = P.line; ctx.lineWidth = 4; ctx.stroke();
  // palen
  const posts = vertical ? Math.floor(h / 90) : Math.floor(w / 90);
  for (let i = 0; i <= posts; i++) {
    const px = vertical ? [x - 4, x + w + 4] : [x + (i * w) / Math.max(1, posts)];
    const py = vertical ? [y + (i * h) / Math.max(1, posts)] : [y - 4, y + h + 4];
    for (const a of px) for (const b of py) { circle(ctx, a, b, 7); ctx.fillStyle = P.woodDark; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke(); }
  }
}

export function drawTerrain(ctx) {
  const r = rng(42);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // ondiep water + schuim rond de kust
  polyPath(ctx, LAND);
  ctx.strokeStyle = 'rgba(128,212,242,0.55)'; ctx.lineWidth = 110; ctx.stroke();
  ctx.strokeStyle = 'rgba(160,226,248,0.6)'; ctx.lineWidth = 56; ctx.stroke();
  ctx.strokeStyle = 'rgba(239,252,255,0.8)'; ctx.lineWidth = 22; ctx.stroke();

  // zand
  polyPath(ctx, LAND); ctx.fillStyle = P.sand; ctx.fill();
  ctx.save(); polyPath(ctx, LAND); ctx.clip();
  for (let i = 0; i < 2600; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    ctx.fillStyle = r() < 0.5 ? 'rgba(231,191,107,0.55)' : 'rgba(255,240,194,0.7)';
    circle(ctx, x, y, 1.5 + r() * 2.5); ctx.fill();
  }
  // schelpjes
  for (let i = 0; i < 120; i++) {
    const x = r() * WORLD_W, y = 600 + r() * 500;
    ctx.fillStyle = r() < 0.5 ? '#fff' : '#ffc6b8';
    ellipse(ctx, x, y, 4, 3, r() * 3); ctx.fill();
  }
  ctx.restore();
  polyPath(ctx, LAND); ctx.strokeStyle = P.sandDark; ctx.lineWidth = 12; ctx.stroke();
  polyPath(ctx, LAND); ctx.strokeStyle = P.line; ctx.lineWidth = 4; ctx.stroke();

  // gras
  ctx.save(); polyPath(ctx, LAND); ctx.clip();
  polyPath(ctx, GRASS); ctx.fillStyle = P.grass; ctx.fill();
  ctx.save(); polyPath(ctx, GRASS); ctx.clip();
  // lichte vlekken
  for (let i = 0; i < 140; i++) {
    const x = r() * WORLD_W, y = 700 + r() * (WORLD_H - 700);
    ctx.fillStyle = 'rgba(163,223,116,0.35)';
    ellipse(ctx, x, y, 40 + r() * 80, 20 + r() * 40, r() * 3); ctx.fill();
  }
  // grasplukjes
  ctx.strokeStyle = 'rgba(70,140,50,0.75)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 2200; i++) {
    const x = r() * WORLD_W, y = 700 + r() * (WORLD_H - 700);
    ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x, y); ctx.lineTo(x + 4, y - 7); ctx.stroke();
  }
  ctx.restore();
  polyPath(ctx, GRASS); ctx.strokeStyle = '#4e9a3a'; ctx.lineWidth = 7; ctx.stroke();
  ctx.restore();

  // paden
  for (const p of PATHS) {
    smoothLine(ctx, p.pts); ctx.strokeStyle = 'rgba(30,20,40,0.15)'; ctx.lineWidth = p.w + 14; ctx.stroke();
    smoothLine(ctx, p.pts); ctx.strokeStyle = P.pathEdge; ctx.lineWidth = p.w + 8; ctx.stroke();
  }
  for (const p of PATHS) { smoothLine(ctx, p.pts); ctx.strokeStyle = P.path; ctx.lineWidth = p.w; ctx.stroke(); }
  for (const p of PATHS) {
    // steentjes langs het pad
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [x1, y1] = p.pts[i], [x2, y2] = p.pts[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 0; d < len; d += 34) {
        const t = d / len;
        const ox = (r() - 0.5) * p.w * 0.7, oy = (r() - 0.5) * p.w * 0.7;
        ctx.fillStyle = 'rgba(214,189,140,0.8)';
        ellipse(ctx, x1 + (x2 - x1) * t + ox, y1 + (y2 - y1) * t + oy, 5, 3.5, r() * 3); ctx.fill();
      }
    }
  }

  // plein
  circle(ctx, PLAZA.x, PLAZA.y, PLAZA.r + 8); ctx.fillStyle = P.pathEdge; ctx.fill();
  circle(ctx, PLAZA.x, PLAZA.y, PLAZA.r); ctx.fillStyle = '#f6e9cc'; ctx.fill();
  ctx.strokeStyle = 'rgba(214,189,140,0.9)'; ctx.lineWidth = 3;
  for (let rr = 40; rr < PLAZA.r; rr += 34) { circle(ctx, PLAZA.x, PLAZA.y, rr); ctx.stroke(); }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    ctx.beginPath(); ctx.moveTo(PLAZA.x + Math.cos(a) * 40, PLAZA.y + Math.sin(a) * 40); ctx.lineTo(PLAZA.x + Math.cos(a) * PLAZA.r, PLAZA.y + Math.sin(a) * PLAZA.r); ctx.stroke();
  }
  circle(ctx, PLAZA.x, PLAZA.y, PLAZA.r); ctx.strokeStyle = P.line; ctx.lineWidth = 4; ctx.stroke();

  // pier en steigers
  planks(ctx, PIER.x, PIER.y, PIER.w, PIER.h, true);
  for (const j of JETTIES) planks(ctx, j.x, j.y, j.w, j.h, j.h > j.w);
}

export function buildTerrainChunks(scene) {
  const cols = Math.ceil(WORLD_W / CHUNK), rows = Math.ceil(WORLD_H / CHUNK);
  const imgs = [];
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const key = `terrain_${cx}_${cy}`;
      if (!scene.textures.exists(key)) {
        makeTexture(scene, key, CHUNK, CHUNK, (ctx) => {
          ctx.translate(-cx * CHUNK, -cy * CHUNK);
          drawTerrain(ctx);
        });
      }
      imgs.push(scene.add.image(cx * CHUNK, cy * CHUNK, key).setOrigin(0).setDepth(-1000));
    }
  }
  return imgs;
}

export function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function inRect(x, y, r, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}
