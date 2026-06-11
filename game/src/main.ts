import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';
import { setupPwaUpdates } from './pwa/update';

setupPwaUpdates();

// Build stamp — confirm a restart took (this changes each time vite (re)starts).
// eslint-disable-next-line no-console
console.log(`%c[dino] build ${__BUILD_TIME__}`, 'color:#8fd');
(window as unknown as { __buildTime: string }).__buildTime = __BUILD_TIME__;

const TILE = 32;
const COLS = 20;
const ROWS = 15;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: TILE * COLS,
  height: TILE * ROWS,
  backgroundColor: '#1a3a1a',
  pixelArt: true,
  // BACKLOG-188: letterbox the fixed 640×480 world to whatever screen holds it
  // (phone PWA included). Pointer worldX/Y stay correct — Phaser's input manager
  // untransforms through the Scale Manager.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, WorldScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
});

// Phone rotation: the browser can report stale dimensions at the moment the
// resize/orientationchange event fires, leaving FIT sized for the old
// orientation (BACKLOG-188 follow-up). Refresh after layout settles.
const refit = () => requestAnimationFrame(() => game.scale.refresh());
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', () => setTimeout(refit, 100));
