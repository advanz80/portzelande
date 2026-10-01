// Parametrisch cartoon-poppetje: speler, collega's, piraten, Jan.
import { P, shade } from './palette.js';
import { style, rrect, circle, ellipse, softShadow, makeTexture, poly } from './draw.js';

export const FW = 72;
export const FH = 100;
const FRAMES = ['idle', 'walk1', 'walk2', 'cheer', 'tired', 'talk'];

export const SKINS = ['#ffdcb8', '#f2c29b', '#d9a066', '#b07443', '#7a4a2a'];
export const HAIRS = ['#2d1e14', '#5a3825', '#a8642b', '#e8c25a', '#d9532b', '#8a8a8a'];
export const SHIRTS = ['#e8504c', '#3d8fe0', '#4cc764', '#f6c33b', '#8e5bd8', '#ff7aa8', '#2ec4b6', '#f59a3c'];
export const HAIR_STYLES = ['short', 'long', 'bun', 'curly', 'mohawk', 'bald'];
export const HATS = [null, 'cap', 'straw', 'bandana', 'sunglasses'];

export function randomLook(r = Math.random, extra = {}) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return {
    skin: pick(SKINS), hair: pick(HAIRS), hairStyle: pick(HAIR_STYLES.slice(0, 5)),
    shirt: pick(SHIRTS), pants: pick(['#3a4a6b', '#5b4636', '#2d3a4a', '#6b6b7a', '#3d6b8a']),
    hat: r() < 0.3 ? pick(['cap', 'straw', 'sunglasses']) : null, ...extra,
  };
}

export function pirateLook(r = Math.random, extra = {}) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return {
    skin: pick(SKINS), hair: pick(HAIRS), hairStyle: pick(['short', 'long', 'curly', 'bald']),
    shirt: '#f4efe4', stripes: pick([P.pirateRed, '#2d4a8a', P.ink]), pants: pick(['#3b2f3f', '#5b4636', '#2d3a4a']),
    hat: pick(['bandana', 'tricorn', 'bandana']), bandana: pick([P.pirateRed, '#2d4a8a', '#3b2f3f']),
    beard: r() < 0.6 ? pick(HAIRS) : null, eyepatch: r() < 0.4, ...extra,
  };
}

function drawFrame(ctx, ox, look, frame) {
  const cx = ox + FW / 2;
  const tired = frame === 'tired';
  const cheer = frame === 'cheer';
  const big = look.scale || 1;
  ctx.save();
  // schaal rond voeten
  ctx.translate(cx, FH - 8);
  ctx.scale(big, big);
  ctx.translate(-cx, -(FH - 8));

  const footY = FH - 10;
  softShadow(ctx, cx, footY + 2, 18, 6);

  const bob = frame === 'walk1' || frame === 'walk2' ? -2 : 0;
  const slump = tired ? 6 : 0;

  // benen
  const legL = frame === 'walk1' ? -3 : frame === 'walk2' ? 2 : 0;
  const legR = frame === 'walk1' ? 2 : frame === 'walk2' ? -3 : 0;
  const pants = look.pants || '#3a4a6b';
  rrect(ctx, cx - 12, footY - 18 + legL + bob, 10, 18 - legL, 4); style(ctx, { fill: pants, lw: 3 });
  rrect(ctx, cx + 2, footY - 18 + legR + bob, 10, 18 - legR, 4); style(ctx, { fill: pants, lw: 3 });
  // schoenen
  ellipse(ctx, cx - 8, footY - 1 + Math.min(0, legL), 7, 4); style(ctx, { fill: look.shoes || P.ink, lw: 2 });
  ellipse(ctx, cx + 8, footY - 1 + Math.min(0, legR), 7, 4); style(ctx, { fill: look.shoes || P.ink, lw: 2 });

  // armen (achter romp bij cheer)
  const shirt = look.shirt || P.red;
  const armY = footY - 40 + bob + slump;
  const drawArm = (side) => {
    const sx = cx + side * 17;
    ctx.save();
    ctx.translate(sx, armY);
    let rot = side * 0.18;
    if (cheer) rot = side * 2.6;
    if (tired) rot = side * 0.05;
    if (frame === 'walk1') rot += side > 0 ? 0.25 : -0.1;
    if (frame === 'walk2') rot += side > 0 ? -0.1 : 0.25;
    if (frame === 'talk' && side > 0) rot = 1.9;
    ctx.rotate(rot);
    rrect(ctx, -5, -2, 10, 20, 5); style(ctx, { fill: shade(shirt, -0.08), lw: 3 });
    circle(ctx, 0, 20, 5); style(ctx, { fill: look.skin, lw: 3 });
    if (look.hook && side > 0) { ctx.beginPath(); ctx.arc(0, 28, 5, 0, Math.PI); style(ctx, { stroke: '#c9c9d6', lw: 3 }); }
    ctx.restore();
  };
  drawArm(-1); drawArm(1);

  // romp
  const bodyTop = footY - 44 + bob + slump;
  rrect(ctx, cx - 16, bodyTop, 32, 30 - slump / 2, 11);
  style(ctx, { fill: shirt, lw: 4 });
  if (look.stripes) {
    ctx.save(); rrect(ctx, cx - 16, bodyTop, 32, 30, 11); ctx.clip();
    ctx.fillStyle = look.stripes;
    for (let i = 0; i < 4; i++) ctx.fillRect(cx - 16, bodyTop + 5 + i * 7, 32, 3);
    ctx.restore();
    rrect(ctx, cx - 16, bodyTop, 32, 30 - slump / 2, 11); style(ctx, { lw: 4 });
  }
  if (look.tie) { poly(ctx, [[cx, bodyTop + 2], [cx - 4, bodyTop + 16], [cx, bodyTop + 22], [cx + 4, bodyTop + 16]]); style(ctx, { fill: look.tie, lw: 2 }); }
  if (look.coat) {
    poly(ctx, [[cx - 16, bodyTop + 4], [cx - 4, bodyTop + 2], [cx - 2, bodyTop + 30], [cx - 16, bodyTop + 30]]); style(ctx, { fill: look.coat, lw: 3 });
    poly(ctx, [[cx + 16, bodyTop + 4], [cx + 4, bodyTop + 2], [cx + 2, bodyTop + 30], [cx + 16, bodyTop + 30]]); style(ctx, { fill: look.coat, lw: 3 });
    circle(ctx, cx - 9, bodyTop + 14, 2); ctx.fillStyle = P.gold; ctx.fill();
    circle(ctx, cx - 9, bodyTop + 22, 2); ctx.fill();
  }
  if (look.badge) { circle(ctx, cx + 8, bodyTop + 10, 4); style(ctx, { fill: look.badge, lw: 2 }); }
  // glans op romp
  ctx.save(); ctx.globalAlpha = 0.25; rrect(ctx, cx - 11, bodyTop + 4, 8, 12, 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();

  // hoofd
  const hy = footY - 62 + bob + slump * 1.2;
  const hr = 20;
  // haar achter (lang)
  if (look.hairStyle === 'long') {
    rrect(ctx, cx - 21, hy - 8, 42, 34, 14); style(ctx, { fill: look.hair, lw: 4 });
  }
  if (look.hairStyle === 'bun') { circle(ctx, cx, hy - 22, 9); style(ctx, { fill: look.hair, lw: 4 }); }
  circle(ctx, cx, hy, hr); style(ctx, { fill: look.skin, lw: 4 });
  // oren
  circle(ctx, cx - hr + 1, hy + 3, 5); style(ctx, { fill: look.skin, lw: 3 });
  circle(ctx, cx + hr - 1, hy + 3, 5); style(ctx, { fill: look.skin, lw: 3 });
  circle(ctx, cx, hy, hr - 2); ctx.fillStyle = look.skin; ctx.fill();

  // haar voor
  const hairTop = () => {
    ctx.beginPath();
    ctx.arc(cx, hy, hr + 1, Math.PI * 1.02, Math.PI * 1.98);
    ctx.quadraticCurveTo(cx + 10, hy - 6, cx, hy - 8);
    ctx.quadraticCurveTo(cx - 12, hy - 4, cx - hr - 1, hy - 2);
    ctx.closePath();
  };
  switch (look.hairStyle) {
    case 'bald': break;
    case 'mohawk':
      rrect(ctx, cx - 5, hy - hr - 10, 10, 20, 5); style(ctx, { fill: look.hair, lw: 3 }); break;
    case 'curly':
      for (let i = -2; i <= 2; i++) { circle(ctx, cx + i * 8, hy - hr + 4 + Math.abs(i) * 3, 8); style(ctx, { fill: look.hair, lw: 3 }); }
      break;
    default:
      hairTop(); style(ctx, { fill: look.hair, lw: 4 });
  }
  if (look.hairStyle === 'long') {
    rrect(ctx, cx - 22, hy - 2, 7, 24, 4); style(ctx, { fill: look.hair, lw: 3 });
    rrect(ctx, cx + 15, hy - 2, 7, 24, 4); style(ctx, { fill: look.hair, lw: 3 });
  }

  // gezicht
  const ey = hy + 3;
  if (tired) {
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 11, ey); ctx.lineTo(cx - 4, ey + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4, ey + 1); ctx.lineTo(cx + 11, ey); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, ey + 12, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // zweetdruppel
    ctx.beginPath(); ctx.moveTo(cx + 16, hy - 12); ctx.quadraticCurveTo(cx + 22, hy - 4, cx + 16, hy - 2); ctx.quadraticCurveTo(cx + 11, hy - 4, cx + 16, hy - 12);
    style(ctx, { fill: P.waterLight, lw: 2 });
  } else {
    const eyeL = () => { ellipse(ctx, cx - 7, ey, 4, 5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke(); circle(ctx, cx - 6, ey + 1, 2.4); ctx.fillStyle = P.ink; ctx.fill(); };
    const eyeR = () => { ellipse(ctx, cx + 7, ey, 4, 5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke(); circle(ctx, cx + 8, ey + 1, 2.4); ctx.fillStyle = P.ink; ctx.fill(); };
    eyeL();
    if (look.eyepatch) {
      ellipse(ctx, cx + 7, ey, 6, 6); ctx.fillStyle = P.ink; ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - hr + 2, hy - 8); ctx.lineTo(cx + hr - 2, hy + 2); ctx.stroke();
    } else eyeR();
    if (look.angry) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 12, ey - 9); ctx.lineTo(cx - 3, ey - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 12, ey - 9); ctx.lineTo(cx + 3, ey - 5); ctx.stroke();
    }
    // blosjes
    ctx.fillStyle = 'rgba(255,110,110,0.35)';
    ellipse(ctx, cx - 12, ey + 8, 4, 2.5); ctx.fill();
    ellipse(ctx, cx + 12, ey + 8, 4, 2.5); ctx.fill();
    // mond
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3;
    if (cheer || frame === 'talk') {
      ctx.beginPath(); ctx.arc(cx, ey + 9, 5, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = '#a8323a'; ctx.fill(); ctx.stroke();
    } else if (look.angry) {
      ctx.beginPath(); ctx.arc(cx, ey + 14, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, ey + 7, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
  }
  if (look.beard) {
    ctx.beginPath();
    ctx.moveTo(cx - hr + 3, hy + 4);
    ctx.quadraticCurveTo(cx - 10, hy + hr + 12, cx, hy + hr + 10);
    ctx.quadraticCurveTo(cx + 10, hy + hr + 12, cx + hr - 3, hy + 4);
    ctx.quadraticCurveTo(cx, hy + 14, cx - hr + 3, hy + 4);
    style(ctx, { fill: look.beard, lw: 3 });
  }
  if (look.glasses) {
    ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
    circle(ctx, cx - 7, ey, 6); ctx.stroke(); circle(ctx, cx + 7, ey, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 1, ey); ctx.lineTo(cx + 1, ey); ctx.stroke();
  }

  // hoeden
  switch (look.hat) {
    case 'cap': {
      ctx.beginPath(); ctx.arc(cx, hy - 4, hr, Math.PI, Math.PI * 2); ctx.closePath(); style(ctx, { fill: look.capColor || shirt, lw: 4 });
      ellipse(ctx, cx + 8, hy - 5, 16, 5); style(ctx, { fill: shade(look.capColor || shirt, -0.15), lw: 3 });
      break;
    }
    case 'straw': {
      ellipse(ctx, cx, hy - 10, 30, 9); style(ctx, { fill: '#f2d27a', lw: 3 });
      ctx.beginPath(); ctx.arc(cx, hy - 10, 15, Math.PI, Math.PI * 2); ctx.closePath(); style(ctx, { fill: '#f2d27a', lw: 3 });
      ctx.fillStyle = P.red; ctx.fillRect(cx - 15, hy - 15, 30, 5);
      break;
    }
    case 'bandana': {
      ctx.beginPath(); ctx.arc(cx, hy - 2, hr + 1, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); style(ctx, { fill: look.bandana || P.pirateRed, lw: 4 });
      ctx.fillStyle = '#fff'; for (let i = -1; i <= 1; i++) { circle(ctx, cx + i * 9, hy - 12, 2); ctx.fill(); }
      poly(ctx, [[cx + hr - 2, hy - 6], [cx + hr + 10, hy - 2], [cx + hr + 6, hy + 6]]); style(ctx, { fill: look.bandana || P.pirateRed, lw: 3 });
      break;
    }
    case 'tricorn':
    case 'captain': {
      const w = look.hat === 'captain' ? 34 : 28;
      ctx.beginPath();
      ctx.moveTo(cx - w, hy - 8);
      ctx.quadraticCurveTo(cx - w / 2, hy - 38, cx, hy - 30);
      ctx.quadraticCurveTo(cx + w / 2, hy - 38, cx + w, hy - 8);
      ctx.quadraticCurveTo(cx, hy - 16, cx - w, hy - 8);
      style(ctx, { fill: P.pirate, lw: 4 });
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - w + 6, hy - 11); ctx.quadraticCurveTo(cx, hy - 18, cx + w - 6, hy - 11); ctx.stroke();
      // doodshoofdje
      circle(ctx, cx, hy - 24, 4.5); ctx.fillStyle = '#fff'; ctx.fill();
      if (look.hat === 'captain') {
        ctx.beginPath(); ctx.moveTo(cx + 8, hy - 30); ctx.quadraticCurveTo(cx + 30, hy - 50, cx + 22, hy - 24); style(ctx, { fill: P.red, lw: 3 });
      }
      break;
    }
    case 'sunglasses': {
      ctx.fillStyle = P.ink;
      rrect(ctx, cx - 14, ey - 5, 12, 9, 3); ctx.fill(); rrect(ctx, cx + 2, ey - 5, 12, 9, 3); ctx.fill();
      ctx.fillRect(cx - 3, ey - 3, 6, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(cx - 11, ey - 3, 3, 2); ctx.fillRect(cx + 5, ey - 3, 3, 2);
      break;
    }
    case 'headset': {
      ctx.beginPath(); ctx.arc(cx, hy - 2, hr + 3, Math.PI * 1.05, Math.PI * 1.95); style(ctx, { stroke: P.ink, lw: 4 });
      rrect(ctx, cx - hr - 5, hy - 2, 8, 12, 3); style(ctx, { fill: P.inkSoft, lw: 2 });
      ctx.beginPath(); ctx.moveTo(cx - hr - 1, hy + 9); ctx.quadraticCurveTo(cx - 14, hy + 18, cx - 6, hy + 14); style(ctx, { stroke: P.ink, lw: 2 });
      break;
    }
    default: break;
  }
  ctx.restore();
}

/** Genereer (of hergebruik) een karakter-spritesheet. Frames: idle, walk1, walk2, cheer, tired, talk. */
export function makeCharacter(scene, key, look) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const pad = look.scale && look.scale > 1 ? look.scale : 1;
  const w = FW, h = FH;
  const tex = makeTexture(scene, key, w * FRAMES.length, h, (ctx) => {
    FRAMES.forEach((f, i) => {
      ctx.save();
      ctx.beginPath(); ctx.rect(i * w, 0, w, h); ctx.clip();
      drawFrame(ctx, i * w, look, f);
      ctx.restore();
    });
  });
  FRAMES.forEach((f, i) => tex.add(f, 0, i * w, 0, w, h));
  void pad;
  return key;
}

/** Zorgt voor walk-animatie voor een karakter-texture. */
export function ensureAnims(scene, key) {
  const a = `${key}_walk`;
  if (!scene.anims.exists(a)) {
    scene.anims.create({ key: a, frames: [{ key, frame: 'walk1' }, { key, frame: 'idle' }, { key, frame: 'walk2' }, { key, frame: 'idle' }], frameRate: 10, repeat: -1 });
  }
  return a;
}
