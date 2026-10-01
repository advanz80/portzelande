import Phaser from 'phaser';

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }
  create() { this.add.text(100, 100, 'Leaderboard'); this.input.once('pointerdown', () => this.scene.start('Menu')); }
}
