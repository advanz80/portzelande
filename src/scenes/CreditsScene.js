import Phaser from 'phaser';

export class CreditsScene extends Phaser.Scene {
  constructor() { super('Credits'); }
  create() { this.add.text(100, 100, 'Credits'); this.input.once('pointerdown', () => this.scene.start('Menu')); }
}
