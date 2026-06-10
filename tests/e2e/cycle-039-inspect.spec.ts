import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-161 — first-contact inspection. Arming, the walk, the beat, and the memory are all
// deterministic (pure keeperFit argmax + stepToward), so the whole flow runs headless.

type W = Record<string, unknown>;

const pickKeeper = (p: Page, id: string) =>
  p.evaluate((x) => ((window as W).__pickKeeper as (i: string) => string)(x), id);
const inspection = (p: Page) =>
  p.evaluate(() => ((window as W).__inspection as () => { name: string; ttl: number } | null)());
const lastInspection = (p: Page) =>
  p.evaluate(() => ((window as W).__lastInspection as () => { name: string; keeperId: string } | null)());
const stepWorld = (p: Page) => p.evaluate(() => ((window as W).__stepWorld as () => unknown)());
const bubbles = (p: Page) => p.evaluate(() => ((window as W).__bubbleTexts as () => string[])());

/** The dino the current observer should draw: max positive __keeperFit across the cast. */
const expectedInspector = (p: Page) =>
  p.evaluate(() => {
    const names = ((window as W).__dinoNames as () => string[])();
    const fit = (window as W).__keeperFit as (n: string) => number;
    let best: { name: string; fit: number } | null = null;
    for (const name of names) {
      const f = fit(name);
      if (!best || f > best.fit || (f === best.fit && name < best.name)) best = { name, fit: f };
    }
    return best && best.fit > 0 ? best.name : null;
  });

test('a fresh boot arms nothing — no inspection from the default observer or save restore', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await inspection(page)).toBeNull();
  expect(await lastInspection(page)).toBeNull();
  expect(errors).toEqual([]);
});

test('switching observers draws the best-fit dino across the bowl for a look', async ({ page }) => {
  await boot(page);

  await pickKeeper(page, 'vanta');
  const expected = await expectedInspector(page);
  expect(expected).not.toBeNull();

  const armed = await inspection(page);
  expect(armed?.name).toBe(expected);

  // Walk the world until the inspector reaches the (stationary) keeper — bounded by the ttl.
  let landed = await lastInspection(page);
  for (let i = 0; i < 24 && !landed; i++) {
    await stepWorld(page);
    landed = await lastInspection(page);
  }
  expect(landed).toEqual({ name: expected, keeperId: 'vanta' });
  expect(await inspection(page)).toBeNull(); // one-shot: disarmed on arrival
});

test('arrival lands the 👀 beat and files the inspect memory', async ({ page }) => {
  await boot(page);

  await pickKeeper(page, 'lumen');
  const expected = await expectedInspector(page);
  test.skip(expected === null, 'no cast member resonates with lumen on this roster');

  for (let i = 0; i < 24 && !(await lastInspection(page)); i++) await stepWorld(page);
  expect((await lastInspection(page))?.name).toBe(expected);

  expect((await bubbles(page)).some((b) => b.includes('👀') && b.includes(expected!))).toBe(true);
  const memory = await page.evaluate(
    (n) => (((window as W).__memory as () => Record<string, string[]>)()[n] ?? []),
    expected!,
  );
  expect(memory.some((m) => m.includes('long look at LUMEN-3'))).toBe(true);
});

test('re-picking the same observer arms nothing', async ({ page }) => {
  await boot(page);

  await pickKeeper(page, 'vanta');
  // Drain the genuine first contact so the re-pick is the only candidate trigger.
  for (let i = 0; i < 24 && !(await lastInspection(page)); i++) await stepWorld(page);

  await pickKeeper(page, 'vanta'); // same id — not a change
  expect(await inspection(page)).toBeNull();
});
