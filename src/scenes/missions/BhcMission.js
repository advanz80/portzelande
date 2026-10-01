import { MissionBase } from './MissionBase.js';

export class BhcMission extends MissionBase {
  constructor() { super('BhcMission', 'bhc', { timeLimit: 30, thresholds: [0, 50, 100] }); }
  startGame() { this.addScore(60, 640, 360); }
}
