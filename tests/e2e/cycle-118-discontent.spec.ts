import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The grumble reaches the keeper (BACKLOG-471) — Milestone 9's last arc. The pure detection + gate are
 * unit-covered (cycle-118-discontent.test.ts); this proves the integration seam: a bank-first ground that
 * actually refuses a starving resident records it, sounds once a day at the glass, clears the moment it
 * feeds someone, and a park with no provider is completely silent.
 */

type W = Record<string, any>;

const DISCONTENT = /going hungry while the granary fills/;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const grumbles = async (p: Page) => (await events(p)).filter((e) => DISCONTENT.test(e));
const ledger = (p: Page) =>
  p.evaluate(() => (window as W).__discontent() as { shorts: Record<string, number>; lastDay: Record<string, number> });
const shorts = async (p: Page, zone = 'bowl') => (await ledger(p)).shorts[zone] ?? 0;
const day = (p: Page) => p.evaluate(() => ((window as W).__clockNow() as { day: number }).day);
const dinoNames = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

async function onlyResident(page: Page, keep: string) {
  for (const n of await dinoNames(page)) {
    if (n !== keep) await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
}

async function harvestBowl(page: Page) {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

/** Starve the named dino and run one world tick — the exact path `feedFromStores` runs on. */
async function starveAndStep(page: Page, name: string) {
  await page.evaluate((n) => (window as W).__setNeed(n, 'hunger', 1), name);
  await page.evaluate(() => (window as W).__stepWorld());
}

/** Crown Rex the bowl's provider. Rex's name-seeded agreeableness is well under 0.5, so its policy is
 *  deterministically 'bank' — asserted rather than assumed, so a trait change fails loudly here. */
async function bankFirstBowl(page: Page) {
  await onlyResident(page, 'Rex');
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  await page.evaluate(() => (window as W).__eat('Rex')); // clear the harvest drop; a piece in play blocks the pantry
  expect((await page.evaluate(() => (window as W).__roles() as Record<string, string>)).Rex).toBe('provider');
  expect(await page.evaluate(() => (window as W).__spendPriority('bowl'))).toBe('bank');
}

test('a bank-first ground that leaves its own short grumbles to the keeper', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await bankFirstBowl(page);

  // Drain the pantry down to the reserve, then keep asking: the reserve starts refusing, and the refusals
  // are what this arc counts. Driven rather than assumed — the store total is ambient-sensitive.
  for (let i = 0; i < 12 && (await shorts(page)) < 2; i++) await starveAndStep(page, 'Rex');

  expect(await shorts(page)).toBeGreaterThanOrEqual(2);
  expect(await grumbles(page)).toHaveLength(1);
  expect((await grumbles(page))[0]).toContain('😟');
  expect(errors).toEqual([]);
});

test('the grumble is a standing, not a tic: once a day, however many mouths go short', async ({ page }) => {
  await boot(page);
  await bankFirstBowl(page);

  for (let i = 0; i < 12 && (await shorts(page)) < 2; i++) await starveAndStep(page, 'Rex');
  const soundedOn = (await ledger(page)).lastDay.bowl;
  expect(soundedOn).toBe(await day(page));

  // Same in-game day, more mouths held short → the ledger keeps counting, the keeper hears nothing new.
  const before = await shorts(page);
  await starveAndStep(page, 'Rex');
  expect(await shorts(page)).toBeGreaterThan(before);
  expect((await ledger(page)).lastDay.bowl).toBe(soundedOn);
  expect(await grumbles(page)).toHaveLength(1);

  // A day later it is worth saying again.
  await page.evaluate((d) => (window as W).__setClock(d + 1, 8, 0), soundedOn);
  await starveAndStep(page, 'Rex');
  expect((await ledger(page)).lastDay.bowl).toBe(soundedOn + 1);
});

test('feeding one of its own clears the grievance', async ({ page }) => {
  await boot(page);
  await bankFirstBowl(page);

  for (let i = 0; i < 12 && (await shorts(page)) < 2; i++) await starveAndStep(page, 'Rex');
  expect(await shorts(page)).toBeGreaterThanOrEqual(2);

  // Bank above the reserve and the pantry opens again — and the ground has nothing left to grumble about.
  await page.evaluate(() => (window as W).__bankFood('bowl', 'berries'));
  await page.evaluate(() => (window as W).__bankFood('bowl', 'berries'));
  await starveAndStep(page, 'Rex');

  expect(await shorts(page)).toBe(0);
  expect(await events(page)).toContainEqual(expect.stringContaining("stores fed Rex"));
});

test('a park with no provider never grumbles — the default ticker is untouched', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__spendPriority('bowl'))).toBeNull();
  for (let i = 0; i < 6; i++) await starveAndStep(page, 'Rex');

  expect(await shorts(page)).toBe(0);
  expect(await grumbles(page)).toHaveLength(0);
  expect(errors).toEqual([]);
});
