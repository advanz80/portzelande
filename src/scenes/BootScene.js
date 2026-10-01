import Phaser from 'phaser';
import { BRANDS } from '../config/brands.js';
import { NPC_LOOKS } from '../config/npcs.js';
import { makeIcons } from '../gfx/tex/icons.js';
import { makeProps, makeStall } from '../gfx/tex/props.js';
import { makeCharacter } from '../gfx/CharacterFactory.js';
import { makeTexture, circle, style } from '../gfx/draw.js';
import { P, FONT, titleStyle } from '../gfx/palette.js';
import { SaveManager } from '../core/SaveManager.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height / 2 - 30, 'Pirates of Port Zélande', titleStyle(56, P.gold)).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - 200, height / 2 + 40, 4, 16, 0xf6c33b).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2 + 40, 408, 24).setStrokeStyle(4, 0xfff8e7);
    this.load.on('progress', (v) => { bar.width = 400 * v; });
    void t;

    // Logo's (optioneel). Ontbrekende bestanden krijgen een fallback-badge.
    this.missingLogos = new Set();
    this.load.on('loaderror', (file) => {
      if (file.key.startsWith('logo_')) this.missingLogos.add(file.key);
    });
    const base = import.meta.env.BASE_URL;
    for (const b of Object.values(BRANDS)) {
      this.load.svg(`logo_${b.id}`, `${base}assets/logos/${b.logo}`, { width: 256, height: 256 });
    }
  }

  create() {
    for (const k of this.missingLogos) if (this.textures.exists(k)) this.textures.remove(k);

    makeIcons(this);
    makeProps(this);
    for (const b of Object.values(BRANDS)) {
      makeStall(this, `stall_${b.id}`, b.css);
      // fallback-logo
      makeTexture(this, `logofb_${b.id}`, 256, 256, (c) => {
        circle(c, 128, 134, 116); c.fillStyle = 'rgba(30,20,40,0.25)'; c.fill();
        circle(c, 128, 126, 116); style(c, { fill: b.css, lw: 12 });
        circle(c, 128, 126, 96); style(c, { stroke: 'rgba(255,255,255,0.5)', lw: 6 });
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const size = b.initials.length > 2 ? 78 : b.initials.length > 1 ? 100 : 130;
        c.font = `700 ${size}px ${FONT.ui}`;
        c.lineWidth = 10; c.strokeStyle = P.ink; c.strokeText(b.initials, 128, 132);
        c.fillText(b.initials, 128, 132);
      });
    }
    for (const [id, look] of Object.entries(NPC_LOOKS)) makeCharacter(this, `npc_${id}`, look);
    if (SaveManager.state?.player?.look) makeCharacter(this, 'player', SaveManager.state.player.look);

    // Debug: ?scene=Naam springt direct naar een scène
    const q = new URLSearchParams(location.search);
    const jump = q.get('scene');
    if (jump && q.has('debug')) {
      if (!SaveManager.state) SaveManager.newGame({ name: 'Tester', look: NPC_LOOKS.petra });
      if (!this.textures.exists('player')) makeCharacter(this, 'player', SaveManager.state.player.look);
      this.scene.start(jump, { debug: true });
      return;
    }
    this.scene.start('Menu');
  }
}
