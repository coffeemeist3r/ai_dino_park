import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Sleep murmurs (BACKLOG-181). A huddling, in-view dino floats a 💭 sleep-line drawn from its day-memory.
 * Deterministic (no model in CI) — the `NPCBrain` boundary is untouched. An awake dino never murmurs.
 */

type W = Record<string, any>;

const huddlers = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__huddlers() as string[]);
const bubbles = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__bubbleTexts() as string[]);

test('a huddling dino murmurs a 💭 sleep-line; an awake dino stays silent', async ({ page }) => {
  await boot(page);

  // At noon nobody is in the den — an awake dino cannot murmur.
  await page.evaluate(() => (window as W).__setClock(1, 12, 0));
  expect(await huddlers(page)).toHaveLength(0);
  expect(await page.evaluate(() => (window as W).__forceMurmur('Rex'))).toBeNull();

  // Bond a pair and set a winter dusk so the den pulls them in (the cycle-042 huddle setup).
  await page.evaluate(() => {
    const w = window as W;
    w.__bondPair('Rex', 'Mossback', undefined);
    w.__setClock(22, 19, 30); // winter, 19:30 — in the huddle window
  });

  // Step until Rex & Mossback are actually huddling in the den.
  await page.evaluate(() => {
    const w = window as W;
    for (let i = 0; i < 60; i++) w.__stepWorld();
  });
  expect(await huddlers(page)).toContain('Rex');

  // Force a murmur past the sparse roll: a 💭 line appears as a live bubble.
  const line = await page.evaluate(() => (window as W).__forceMurmur('Rex') as string | null);
  expect(line).not.toBeNull();
  expect(line!.startsWith('💭')).toBe(true);
  expect(await bubbles(page)).toContain(line);
});

test('the murmur line is deterministic per dino from its memory (no model needed)', async ({ page }) => {
  await boot(page);
  // __murmur reads the dino's current memory ring → a stable 💭 line; memoryless dinos doze.
  const line = await page.evaluate(() => (window as W).__murmur('Rex') as string);
  expect(line.startsWith('💭')).toBe(true);
});
