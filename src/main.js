import Phaser from 'phaser';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/pirata-one/400.css';

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterScene } from './scenes/CharacterScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { DialogScene } from './scenes/DialogScene.js';
import { LeaderboardScene } from './scenes/LeaderboardScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';
import { CreditsScene } from './scenes/CreditsScene.js';
import { MISSION_SCENES } from './scenes/missions/index.js';
import { SaveManager } from './core/SaveManager.js';
import { Audio } from './core/AudioEngine.js';

window.Phaser = Phaser;

async function start() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 24px Fredoka'),
        document.fonts.load('700 24px Fredoka'),
        document.fonts.load('400 24px "Pirata One"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fallback-fonts */ }
  document.getElementById('loading')?.remove();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#0f3d5c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    dom: { createContainer: true },
    input: { activePointers: 3 },
    render: { antialias: true, powerPreference: 'high-performance' },
    fps: { target: 60 },
    scene: [BootScene, MenuScene, CharacterScene, WorldScene, HUDScene, DialogScene, LeaderboardScene, FinaleScene, CreditsScene, ...MISSION_SCENES],
  });

  // Audio ontgrendelen bij eerste interactie
  const unlock = () => Audio.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  // Speeltijd bijhouden (alleen tijdens actief spel)
  let saveAcc = 0;
  game.events.on('step', (_t, delta) => {
    if (!SaveManager.clockRunning || document.hidden) return;
    SaveManager.addTime(Math.min(delta, 100));
    saveAcc += delta;
    if (saveAcc > 5000) { saveAcc = 0; SaveManager.save(); }
  });

  if (new URLSearchParams(location.search).has('debug')) window.__game = game;
}

start();
