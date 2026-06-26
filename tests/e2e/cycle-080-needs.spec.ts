import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Need-drive spine (BACKLOG-371). Each dino's hunger/thirst builds over forceSteps and resolves through
 * existing actions — eating at the hatch sates hunger, reaching the grove pond sates thirst — surfaced as
 * a 🍖/💧 tell. Deathless: a need only ever builds and resolves, nothing dies.
 */

type W = Record<string, any>;

const pressing = (p: Page, n: string) => p.evaluate((name) => (window as W).__pressingNeed(name), n);
const needs = (p: Page) => p.evaluate(() => (window as W).__needs() as Record<string, { hunger: number; thirst: number }>);
const population = (p: Page) => p.evaluate(() => (window as W).__population() as number);

test('needs build until a dino is in want, then eating at the hatch sates its hunger', async ({ page }) => {
  await boot(page);

  // Fresh dinos are sated — nothing pressing.
  expect(await pressing(page, 'Rex')).toBeNull();

  // Let needs build past the threshold. Hunger builds ~2× thirst, so it's the pressing one here
  // (thirst is still well under its own cap, so no tie). 120 steps crosses 0.6 for any energy.
  await page.evaluate(() => (window as W).__advanceNeeds(120));
  expect(await pressing(page, 'Rex')).toBe('hunger');

  // Drop food in the column of the first dino and step until the swarm eats it.
  const ate = await page.evaluate(() => {
    const w = window as W;
    const positions = w.__dinoPositions() as Array<{ name: string; x: number; y: number }>;
    const col = Math.round((positions[0].x - 16) / 32);
    w.__dropFood(col);
    let steps = 0;
    while (w.__food() !== null && steps < 20) {
      w.__stepWorld();
      steps++;
    }
    return w.__food() === null;
  });
  expect(ate).toBe(true);

  // Whoever ate had its hunger reset to ~0 (the post-eat step re-advances it only a hair).
  const after = await needs(page);
  const minHunger = Math.min(...Object.values(after).map((n) => n.hunger));
  expect(minHunger).toBeLessThan(0.1);
});

test('a thirsty dino that reaches the pond drinks (thirst → 0)', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__setNeed('Rex', 'thirst', 0.9));
  expect((await needs(page)).Rex.thirst).toBeGreaterThan(0.6);

  // Drop Rex into the grove beside the pond water (reusing __seePond's placement) and run the needs tick
  // in place — within sight of the water, it drinks.
  await page.evaluate(() => {
    (window as W).__seePond('Rex');
    (window as W).__checkNeeds();
  });
  expect((await needs(page)).Rex.thirst).toBe(0);
});

test('the bowl is deathless — pinning a need at the max never changes the population', async ({ page }) => {
  await boot(page);
  const before = await population(page);
  await page.evaluate(() => (window as W).__advanceNeeds(5000)); // everyone starves + parches, pinned at 1
  expect(await population(page)).toBe(before);
  // and they still build/report — the state persists, nobody was removed (both needs maxed → still in want)
  expect(await pressing(page, 'Rex')).not.toBeNull();
});
