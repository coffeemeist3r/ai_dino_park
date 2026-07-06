import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Home-zone belonging (BACKLOG-341) — a dino that resides in its zone long enough *settles*: the
 * collection book reads "at home in <zone>", and (in-world) a settled dino resists the ambient wander.
 * Tenure accrues on the migration cadence (`__settleTick`) and resets on a zone crossing. Milestone 2
 * lore arc 1. The migration damp itself is randomness, unit-pinned in belonging.test.ts; this proves the
 * observable state: tenure → settled → book line → reset on move.
 */

type W = Record<string, any>;

const dinoName = (p: Page) => p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[])[0].name);
const settleTick = (p: Page) => p.evaluate(() => (window as W).__settleTick());
const settled = (p: Page, n: string) => p.evaluate((nn) => (window as W).__settled(nn) as boolean, n);
const tenure = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tenure(nn) as number, n);
const bookText = (p: Page) => p.evaluate(() => (window as W).__bookText() as string);

test('a dino settles into its home zone after enough tenure, and the book reads it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const name = await dinoName(page);
  // SETTLE_ROLLS = 4: below the threshold it is not yet at home.
  expect(await settled(page, name)).toBe(false);
  await settleTick(page);
  await settleTick(page);
  await settleTick(page);
  expect(await tenure(page, name)).toBe(3);
  expect(await settled(page, name)).toBe(false); // 3 < 4
  await settleTick(page);
  expect(await settled(page, name)).toBe(true); // 4 ≥ 4 — settled

  // The book surfaces the home-zone standing (a bowl dino → "at home in Pocket Cretaceous").
  expect(await bookText(page)).toContain('at home in Pocket Cretaceous');

  expect(errors).toEqual([]);
});

test('crossing to a new zone resets tenure — home starts fresh', async ({ page }) => {
  await boot(page);
  const name = await dinoName(page);

  for (let i = 0; i < 5; i++) await settleTick(page);
  expect(await settled(page, name)).toBe(true);

  // Moving to another zone (the instant __migrate path) resets its residence — no longer at home.
  await page.evaluate((n) => (window as W).__migrate(n, 'grove'), name);
  expect(await tenure(page, name)).toBe(0);
  expect(await settled(page, name)).toBe(false);
});
