import Phaser from 'phaser';

export class FinaleScene extends Phaser.Scene {
  constructor() { super('Finale'); }
  create() { this.add.text(100, 100, 'Finale'); this.input.once('pointerdown', () => this.scene.start('Menu')); }
}
