import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';

// Build stamp — confirm a restart took (this changes each time vite (re)starts).
// eslint-disable-next-line no-console
console.log(`%c[dino] build ${__BUILD_TIME__}`, 'color:#8fd');
(window as unknown as { __buildTime: string }).__buildTime = __BUILD_TIME__;

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
