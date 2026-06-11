/**
 * One-off PWA icon generator. Draws the park's pixel dino on a canvas in
 * headless Chromium and screenshots it to game/public/icons/.
 *
 * Run from repo root:  node game/scripts/make-icons.mjs
 * Outputs are committed; re-run only when the icon art changes.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// 16x16 pixel dino. '.'=background, 'G'=body, 'D'=outline/dark, 'W'=eye white, 'K'=pupil.
const SPRITE = [
  '................',
  '......DDDD......',
  '.....DGGGGD.....',
  '.....DGWKGD.....',
  '.....DGGGGD.....',
  '.....DGGDDD.....',
  '.DD..DGGD.......',
  '.DGD.DGGGDDD....',
  '.DGGDDGGGGGGD...',
  '..DGGGGGGGGD....',
  '...DGGGGGGD.....',
  '....DGGGGGGD....',
  '....DGGD.DGGD...',
  '....DGD...DGD...',
  '....DDD...DDD...',
  '................',
];

const COLORS = { G: '#8fd14f', D: '#3a5a23', W: '#f5f5e8', K: '#16160f' };
const BG = '#1a3a1a';

const page = await (await chromium.launch()).newPage();

for (const size of [512, 192]) {
  const cell = size / SPRITE.length;
  await page.setContent(`<canvas id="c" width="${size}" height="${size}"></canvas>`);
  await page.evaluate(
    ({ sprite, colors, bg, cell, size }) => {
      const ctx = document.getElementById('c').getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      sprite.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (ch === '.') return;
          ctx.fillStyle = colors[ch];
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }),
      );
    },
    { sprite: SPRITE, colors: COLORS, bg: BG, cell, size },
  );
  const path = join(outDir, `icon-${size}.png`);
  await page.locator('#c').screenshot({ path });
  console.log(`wrote ${path}`);
}

await page.context().browser().close();
