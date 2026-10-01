import { MissionBase } from './MissionBase.js';

export class IjkMission extends MissionBase {
  constructor() { super('IjkMission', 'ijk', { timeLimit: 30, thresholds: [0, 50, 100] }); }
  startGame() { this.addScore(60, 640, 360); }
}
