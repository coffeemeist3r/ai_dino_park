import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

// Carry word of `sufferer`'s cold night to `carrier` the real way (plant the cold memory on the
// sufferer, then spread it), so the carried string is exactly `coldWordLine(sufferer)`.
async function carryColdWord(page: import('@playwright/test').Page, carrier: string, sufferer: string) {
  await page.evaluate(
    ([c, s]) => {
      ((window as W).__rememberCold as (n: string) => void)(s);
      ((window as W).__spreadColdWord as (a: string, b: string) => string | null)(s, c);
    },
    [carrier, sufferer],
  );
}

test('the all-clear travels: a corrector spreads the relief to a third dino, 1 hop, with a 😌 log', async ({ page }) => {
  await boot(page);

  const [carrier, sufferer, third, fourth] = await page.evaluate(() =>
    ((window as W).__dinoNames as () => string[])(),
  );
  // The carrier heard the sufferer slept cold, then met it warmed and self-corrected (BACKLOG-234):
  // it now carries the first-hand relief memory `saw <sufferer> came through it fine`.
  await carryColdWord(page, carrier, sufferer);
  await page.evaluate((s) => ((window as W).__rememberWarm as (n: string) => void)(s), sufferer);
  await page.evaluate(
    ([a, b]) => ((window as W).__selfCorrect as (x: string, y: string) => unknown)(a, b),
    [carrier, sufferer],
  );

  // The carrier now meets a THIRD dino, never near the sufferer, and leads with the all-clear.
  const rumor = await page.evaluate(
    ([a, b]) => ((window as W).__spreadReliefWord as (x: string, y: string) => string | null)(a, b),
    [carrier, third],
  );
  expect(rumor).not.toBeNull();
  expect(rumor).toContain('came through it fine');
  expect(rumor).toContain(sufferer);

  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory[third].some((e) => e.includes('came through it fine') && e.includes(sufferer))).toBe(true);

  // 1-hop ceiling: the third dino merely HEARD it, so it can't re-spread the all-clear.
  const second = await page.evaluate(
    ([a, b]) => ((window as W).__spreadReliefWord as (x: string, y: string) => string | null)(a, b),
    [third, fourth],
  );
  expect(second).toBeNull();

  // The converse seam logs the distinct 😌 all-clear when a corrector leads with the relief.
  await page.evaluate(() => ((window as W).__forceConverse as () => Promise<unknown>)());
  const events = await page.evaluate(() => ((window as W).__events as () => string[])());
  expect(events.some((e) => e.includes('😌') && e.includes(carrier))).toBe(true);
});

test('control: a dino with no relief memory spreads no all-clear', async ({ page }) => {
  await boot(page);

  const [carrier, third] = await page.evaluate(() => ((window as W).__dinoNames as () => string[])());

  const rumor = await page.evaluate(
    ([a, b]) => ((window as W).__spreadReliefWord as (x: string, y: string) => string | null)(a, b),
    [carrier, third],
  );
  expect(rumor).toBeNull();

  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect((memory[third] ?? []).some((e) => e.includes('came through it fine'))).toBe(false);
});
