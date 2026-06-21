import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Idle fidgets (BACKLOG-298). A wandering dino shows its trait-derived signature quirk instead of the
 * generic 🚶, so idle dinos read as individuals. The 295 activity stays 'wandering' — only the glyph
 * changes. Drives headless: step ordinary life, find a wanderer, assert its mark is its quirk glyph.
 */

type W = Record<string, any>;

test('a wandering dino shows its signature quirk glyph, not the generic walker', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page); // 08:00, clear — no food, no huddle, no sky: dinos idle/wander

  const roster: string[] = await page.evaluate(() =>
    ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name),
  );

  // Find a dino that is wandering after a step (most will be; loop a few steps to be safe).
  let found: string | null = null;
  for (let i = 0; i < 6 && !found; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    for (const n of roster) {
      const act = await page.evaluate((name) => (window as W).__activity(name), n);
      if (act === 'wandering') {
        found = n;
        break;
      }
    }
  }
  expect(found).not.toBeNull();

  const quirk = await page.evaluate((name) => (window as W).__fidget(name), found);
  const mark = await page.evaluate((name) => (window as W).__activityMark(name), found);
  expect(quirk.glyph).toBeTruthy();
  expect(mark).toBe(quirk.glyph); // the wanderer renders its quirk…
  expect(mark).not.toBe('🚶'); // …not the generic walker
  expect(errors).toEqual([]);
});

test('the signature quirk is deterministic across reloads', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => (window as W).__fidget('Rex'));
  await page.reload();
  await boot(page);
  const after = await page.evaluate(() => (window as W).__fidget('Rex'));
  expect(after).toEqual(before);
});
