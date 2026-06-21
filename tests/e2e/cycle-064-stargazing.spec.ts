import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Stargazing companions (BACKLOG-288). When a sky event ends, two dinos that watched it from adjacent
 * spots (Chebyshev ≤ 1) come away a little closer — a one-time shared-wonder bond bump + a "watched the
 * sky together" memory. Drives headless through the dev hooks: trigger the sky, settle the gazers, end it.
 */

type W = Record<string, any>;

const advance = (page: import('@playwright/test').Page, n: number) =>
  page.evaluate((m) => (window as W).__advanceMinutes(m) as { hour: number }, n);
const stepWorld = (page: import('@playwright/test').Page) => page.evaluate(() => (window as W).__stepWorld());
const companions = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__skyCompanions() as [string, string][]);
const bondPair = (page: import('@playwright/test').Page, a: string, b: string) =>
  page.evaluate(([x, y]) => (window as W).__bonds()[[x, y].sort().join('|')] ?? 0, [a, b]);
const memoryOf = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((n) => ((window as W).__memory?.()[n] ?? []) as string[], name);

test('two dinos that watched side by side come away closer', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await advance(page, 14 * 60); // 08:00 → 22:00, a clear night
  await page.evaluate(() => (window as W).__triggerSky('meteors'));

  for (let i = 0; i < 25; i++) await stepWorld(page); // let every dino settle at its gaze ring

  const pairs = await companions(page);
  expect(pairs.length).toBeGreaterThan(0); // the bold crowd under the sky → at least one adjacent pair
  const [a, b] = pairs[0];

  // End the event: push past the 90-minute spectacle (still night), then one more step ends + knits.
  await advance(page, 100);
  await stepWorld(page);

  // The companion memory is the deterministic signal — each watcher names the other, exactly once.
  // (The bond bump itself is pinned in the unit test; in-world it saturates at the 100 cap, so the
  // memory is the reliable end-to-end proof the pair was knit.) Exclude gossip rumors ('told me:'),
  // which can re-spread the line second-hand on later steps.
  const firstHandSky = (m: string) => m.includes('watched the sky together') && !m.includes('told me:');
  expect((await memoryOf(page, a)).filter((m) => firstHandSky(m) && m.includes(b)).length).toBe(1);
  expect((await memoryOf(page, b)).filter((m) => firstHandSky(m) && m.includes(a)).length).toBe(1);

  // One-time: stepping again after the event ended files no further first-hand companion memory.
  const skyCountA = (await memoryOf(page, a)).filter(firstHandSky).length;
  await stepWorld(page);
  expect((await memoryOf(page, a)).filter(firstHandSky).length).toBe(skyCountA);
  expect(errors).toEqual([]);
});

test('the companion bond persists into the exported save', async ({ page }) => {
  await boot(page);
  await advance(page, 14 * 60);
  await page.evaluate(() => (window as W).__triggerSky('meteors'));
  for (let i = 0; i < 25; i++) await stepWorld(page);
  const [a, b] = (await companions(page))[0];
  await advance(page, 100);
  await stepWorld(page);

  const expected = await bondPair(page, a, b);
  const save = JSON.parse(await page.evaluate(() => (window as W).__exportSave() as string));
  expect(save.bonds[[a, b].sort().join('|')]).toBe(expected);
});
