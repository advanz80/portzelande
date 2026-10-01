import { MissionBase } from './MissionBase.js';

export class HaertMission extends MissionBase {
  constructor() { super('HaertMission', 'haert', { timeLimit: 30, thresholds: [0, 50, 100] }); }
  startGame() { this.addScore(60, 640, 360); }
}
