import { MissionBase } from './MissionBase.js';

export class DriessenMission extends MissionBase {
  constructor() { super('DriessenMission', 'driessen', { timeLimit: 30, thresholds: [0, 50, 100] }); }
  startGame() { this.addScore(60, 640, 360); }
}
