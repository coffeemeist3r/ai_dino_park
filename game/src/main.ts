import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';

const TILE = 32;
const COLS = 20;
const ROWS = 15;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: TILE * COLS,
  height: TILE * ROWS,
  backgroundColor: '#1a3a1a',
  pixelArt: true,
  scene: [BootScene, WorldScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
});
