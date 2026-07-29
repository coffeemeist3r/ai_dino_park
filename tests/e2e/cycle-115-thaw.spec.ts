import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Spring thaw relief (BACKLOG-215) — the winter→spring turn rewards the dinos that toughed the cold nights
 * (179 shiver / 208 neglect) with a one-off friendship lift, a 🌱 relief line, and a "made it through the
 * winter" memory. A keeper-warmed dino (184) did not tough it out alone and is excluded. Driven through the
 * real runThawRelief path via the __thawRelief dev hook (the same pass the live spring turn runs).
 */

type W = Record<string, any>;

const friendship = (p: Page) => p.evaluate(() => (window as W).__friendshipPoints() as Record<string, number>);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

test('a dino that toughed a cold night gets a one-off lift + relief line at the thaw', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [survivor, warmed] = await names(page); // any two distinct residents
  await page.evaluate((n) => (window as W).__rememberCold(n), survivor);
  await page.evaluate((n) => (window as W).__rememberWarm(n), warmed);

  const before = await friendship(page);
  await page.evaluate(() => (window as W).__thawRelief());
  const after = await friendship(page);

  // The survivor warmed to the keeper by exactly THAW_LIFT (4); the keeper-warmed dino got nothing.
  expect((after[survivor] ?? 0) - (before[survivor] ?? 0)).toBe(4);
  expect((after[warmed] ?? 0) - (before[warmed] ?? 0)).toBe(0);

  // No silent change — the relief line named the survivor.
  expect((await events(page)).some((e) => e.includes('🌱') && e.includes(survivor) && e.includes('made it through the winter'))).toBe(true);

  expect(errors).toEqual([]);
});

test('a dino with no cold memory gets no thaw relief', async ({ page }) => {
  await boot(page);
  const [d] = await names(page);
  const before = await friendship(page);
  await page.evaluate(() => (window as W).__thawRelief());
  const after = await friendship(page);
  expect((after[d] ?? 0) - (before[d] ?? 0)).toBe(0);
});
