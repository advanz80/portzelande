import { MissionBase } from './MissionBase.js';

export class BloeijMission extends MissionBase {
  constructor() { super('BloeijMission', 'bloeij', { timeLimit: 30, thresholds: [0, 50, 100] }); }
  startGame() { this.addScore(60, 640, 360); }
}
