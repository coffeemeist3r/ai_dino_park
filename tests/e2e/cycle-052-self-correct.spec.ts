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

test('a carrier meeting a recovered sufferer drops the worry with relief — and is not a pity visit', async ({ page }) => {
  await boot(page);

  const [carrier, sufferer] = await page.evaluate(() => ((window as W).__dinoNames as () => string[])());
  await carryColdWord(page, carrier, sufferer);
  // The sufferer has since been warmed by the keeper (BACKLOG-184): it recovered.
  await page.evaluate((s) => ((window as W).__rememberWarm as (n: string) => void)(s), sufferer);

  const bondBefore = await page.evaluate(
    ([a, b]) => ((window as W).__bond as (x: string, y: string) => number)(a, b),
    [carrier, sufferer],
  );

  await page.evaluate(() => ((window as W).__forceConverse as () => Promise<unknown>)());

  const coldWord = await page.evaluate((s) => ((window as W).__coldWord as (x: string) => string)(s), sufferer);
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  // The stale cold word is gone from the carrier; a first-hand relief memory took its place.
  expect(memory[carrier]).not.toContain(coldWord);
  expect(memory[carrier].some((e) => e.includes(`saw ${sufferer} came through it fine`))).toBe(true);

  // A 😌 all-clear in the log, and NO 🫂 pity visit for this meeting.
  const events = await page.evaluate(() => ((window as W).__events as () => string[])());
  expect(events.some((e) => e.includes('😌') && e.includes(sufferer))).toBe(true);

  // The pity visit was suppressed — the bond is unchanged by this meeting's cold-rumor handling.
  const bondAfter = await page.evaluate(
    ([a, b]) => ((window as W).__bond as (x: string, y: string) => number)(a, b),
    [carrier, sufferer],
  );
  expect(bondAfter).toBe(bondBefore);
});

test('control: a carrier meeting a still-cold sufferer pities it — the sympathy visit fires, no drop', async ({ page }) => {
  await boot(page);

  const [carrier, sufferer] = await page.evaluate(() => ((window as W).__dinoNames as () => string[])());
  await carryColdWord(page, carrier, sufferer); // sufferer NOT warmed → not recovered

  const bondBefore = await page.evaluate(
    ([a, b]) => ((window as W).__bond as (x: string, y: string) => number)(a, b),
    [carrier, sufferer],
  );

  await page.evaluate(() => ((window as W).__forceConverse as () => Promise<unknown>)());

  // The sympathy visit fired (🫂 + a bond bump), and the cold word was NOT dropped.
  const events = await page.evaluate(() => ((window as W).__events as () => string[])());
  expect(events.some((e) => e.includes('🫂'))).toBe(true);

  const bondAfter = await page.evaluate(
    ([a, b]) => ((window as W).__bond as (x: string, y: string) => number)(a, b),
    [carrier, sufferer],
  );
  expect(bondAfter).toBeGreaterThan(bondBefore);

  const coldWord = await page.evaluate((s) => ((window as W).__coldWord as (x: string) => string)(s), sufferer);
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory[carrier]).toContain(coldWord);
});
