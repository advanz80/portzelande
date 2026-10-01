import { MissionBase } from './MissionBase.js';

export class ReijnMission extends MissionBase {
  constructor() { super('ReijnMission', 'reijn', { timeLimit: 30, thresholds: [0, 50, 100] }); }
  startGame() { this.addScore(60, 640, 360); }
}
