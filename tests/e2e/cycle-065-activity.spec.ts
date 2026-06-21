import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Dino activity readout (BACKLOG-295). Each dino carries a glyph for what it's doing now, read off the
 * same intent ladder forceStep uses. Drives headless: step ordinary life, then force a sky event.
 */

type W = Record<string, any>;
const VALID = ['gazing', 'inspecting', 'responding', 'feeding', 'huddling', 'gathering', 'socializing', 'wandering'];

const names = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const activity = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((n) => (window as W).__activity(n) as string | null, name);
const step = (page: import('@playwright/test').Page) => page.evaluate(() => (window as W).__stepWorld());

test('every dino carries a valid activity, and a daytime step is none-gazing', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page); // boots at 08:00, a clear day — no sky, no food, no huddle

  await step(page);
  const roster = await names(page);
  for (const n of roster) {
    const a = await activity(page, n);
    expect(VALID).toContain(a); // the readout is populated for every dino
    expect(a).not.toBe('gazing'); // no sky event running
  }
  expect(errors).toEqual([]);
});

test('a sky event makes the whole cast read gazing', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__advanceMinutes(14 * 60)); // → 22:00, clear night
  await page.evaluate(() => (window as W).__triggerSky('meteors'));
  await step(page);

  const roster = await names(page);
  for (const n of roster) expect(await activity(page, n)).toBe('gazing');
});
