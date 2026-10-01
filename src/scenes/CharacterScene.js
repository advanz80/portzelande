import Phaser from 'phaser';
import { t, setTextVars } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle, FONT } from '../gfx/palette.js';
import { button, panel, transitionTo } from '../ui/widgets.js';
import { SKINS, HAIRS, SHIRTS, HAIR_STYLES, HATS, makeCharacter, randomLook } from '../gfx/CharacterFactory.js';
import { SaveManager } from '../core/SaveManager.js';
import { Audio } from '../core/AudioEngine.js';
import { burst } from '../core/Juice.js';

const OPTIONS = [
  { key: 'skin', list: SKINS, type: 'color' },
  { key: 'hair', list: HAIRS, type: 'color' },
  { key: 'style', prop: 'hairStyle', list: HAIR_STYLES, type: 'value' },
  { key: 'shirt', list: SHIRTS, type: 'color' },
  { key: 'hat', list: HATS, type: 'value' },
];

export class CharacterScene extends Phaser.Scene {
  constructor() { super('Character'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 15, 61, 92);
    this.add.tileSprite(0, 0, width, height, 'water').setOrigin(0);
    this.waves = this.add.tileSprite(0, 0, width, height, 'waves').setOrigin(0).setAlpha(0.5);

    this.look = { ...randomLook(), hat: null, pants: '#3a4a6b' };
    this.idx = { skin: 1, hair: 1, style: 0, shirt: 0, hat: 0 };
    this.applyIdx();

    this.add.text(width / 2, 60, t('character.title'), titleStyle(60, P.gold)).setOrigin(0.5);

    // voorbeeld
    panel(this, 330, 400, 420, 520);
    this.add.image(330, 600, 'shadow').setScale(3, 2.4);
    this.preview = this.add.sprite(330, 610, 'icons', 'star').setOrigin(0.5, 1).setScale(3.4);
    this.refreshPreview();
    this.tweens.add({ targets: this.preview, scaleY: 3.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // naam
    panel(this, 880, 400, 620, 520);
    this.add.text(600, 175, t('character.namePrompt'), textStyle(26, P.ink)).setOrigin(0, 0.5);
    const prevName = SaveManager.state?.player?.name || '';
    this.nameEl = this.add.dom(880, 225).createFromHTML(
      `<input type="text" maxlength="16" placeholder="${t('character.namePlaceholder')}" value="${prevName.replace(/"/g, '')}"
        style="width:540px;height:52px;border:4px solid ${P.ink};border-radius:16px;padding:0 16px;font:600 26px ${FONT.ui};color:${P.ink};background:#fff;outline:none;box-sizing:border-box" />`,
    );

    // opties
    this.swatchMap = {};
    OPTIONS.forEach((o, i) => {
      const y = 300 + i * 62;
      this.add.text(600, y, t(`character.${o.key}`), textStyle(24, P.ink)).setOrigin(0, 0.5);
      const swatch = this.add.container(900, y);
      const arrowL = button(this, 790, y, '◀', () => this.step(o, -1, swatch), { width: 64, height: 54, color: HEX.cream });
      const arrowR = button(this, 1100, y, '▶', () => this.step(o, 1, swatch), { width: 64, height: 54, color: HEX.cream });
      void arrowL; void arrowR;
      this.drawSwatch(o, swatch);
      this.swatchMap[o.key] = swatch;
    });

    button(this, 740, 610, t('character.random'), () => this.randomize(), { width: 230, color: HEX.teal, icon: 'bulb', size: 22 });
    button(this, 1000, 610, t('character.start'), () => this.start(), { width: 260, color: HEX.gold, icon: 'ship' });
  }

  applyIdx() {
    const i = this.idx;
    this.look.skin = SKINS[i.skin];
    this.look.hair = HAIRS[i.hair];
    this.look.hairStyle = HAIR_STYLES[i.style];
    this.look.shirt = SHIRTS[i.shirt];
    this.look.hat = HATS[i.hat];
  }

  drawSwatch(o, c) {
    c.removeAll(true);
    const v = o.list[this.idx[o.key]];
    if (o.type === 'color') {
      c.add(this.add.circle(0, 0, 22, parseInt(v.slice(1), 16)).setStrokeStyle(4, HEX.ink));
    } else {
      const label = { short: 'Kort', long: 'Lang', bun: 'Knot', curly: 'Krullen', mohawk: 'Hanenkam', bald: 'Kaal', cap: 'Pet', straw: 'Strohoed', bandana: 'Bandana', sunglasses: 'Zonnebril' }[v] || 'Niks';
      c.add(this.add.text(0, 0, label, textStyle(24, P.ink)).setOrigin(0.5));
    }
  }

  step(o, d, swatch) {
    this.idx[o.key] = (this.idx[o.key] + d + o.list.length) % o.list.length;
    this.applyIdx();
    this.drawSwatch(o, swatch);
    this.refreshPreview();
    Audio.sfx('pop');
  }

  refreshPreview() {
    makeCharacter(this, 'preview_char', this.look);
    this.preview.setTexture('preview_char', 'cheer');
    this.time.delayedCall(250, () => this.preview.setFrame('idle'));
  }

  randomize() {
    for (const o of OPTIONS) this.idx[o.key] = Phaser.Math.Between(0, o.list.length - 1);
    this.applyIdx();
    for (const o of OPTIONS) this.drawSwatch(o, this.swatchMap[o.key]);
    this.refreshPreview();
    Audio.sfx('select');
  }

  start() {
    const input = this.nameEl.node.querySelector('input');
    const name = (input.value || '').trim().slice(0, 16) || t('character.defaultName');
    SaveManager.newGame({ name, look: { ...this.look } });
    makeCharacter(this, 'player', this.look);
    setTextVars({ naam: name });
    burst(this, 330, 400, 'confetti', 40);
    Audio.sfx('great');
    this.time.delayedCall(350, () => transitionTo(this, 'World'));
  }

  update(_t, dt) { this.waves.tilePositionX += dt * 0.02; }
}
