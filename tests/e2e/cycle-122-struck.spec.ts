import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Still full of the place it left (BACKLOG-347) — Milestone 11's first lore arc, and the near end of the
 * clock 362 built. A dino that has just crossed carries the ground it came from for a roll or two: it files
 * the memory on arrival and glances back with that ground's keepsake glyph on the next migration roll.
 *
 * The beat keys on *whichever* ground it left, which is the whole point of taking the cycle-75 item at its
 * generalized reading — these specs cross out of three different grounds on purpose.
 */

type W = Record<string, any>;

const struck = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__struck(n) as { from: string; glyph: string } | null, name);
const memoryOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const settleTick = (p: Page) => p.evaluate(() => (window as W).__settleTick());
const bookRows = (p: Page) =>
  p.evaluate(() => (window as W).__bookRows() as Array<{ name: string; struck?: string }>);

test('a dino that has never crossed is full of nowhere', async ({ page }) => {
  await boot(page);
  expect(await struck(page, 'Mossback')).toBeNull();
  await settleTick(page);
  expect(await struck(page, 'Mossback')).toBeNull();
  expect((await memoryOf(page, 'Mossback')).some((m) => m.includes('still full of'))).toBe(false);
});

test('crossing files the ground it left, by name, whichever ground that is', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  expect((await memoryOf(page, 'Mossback')).some((m) => m.includes('still full of Pocket Cretaceous'))).toBe(true);

  // and again from the grove — the record follows the dino, it is not pinned to one zone
  await page.evaluate(() => (window as W).__migrate('Mossback', 'fernreach'));
  expect((await memoryOf(page, 'Mossback')).some((m) => m.includes('still full of The Grove'))).toBe(true);
  expect((await struck(page, 'Mossback'))!.from).toBe('grove');
});

test('the glance back carries that ground’s own keepsake glyph', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Sunny', 'grove'));
  expect(await struck(page, 'Sunny')).toEqual({ from: 'bowl', glyph: '🌾' });

  await page.evaluate(() => (window as W).__migrate('Twitch', 'fernreach'));
  await page.evaluate(() => (window as W).__migrate('Twitch', 'hollow'));
  expect(await struck(page, 'Twitch')).toEqual({ from: 'fernreach', glyph: '🍂' });
});

test('the place wears off: the window closes after two rolls', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  expect(await struck(page, 'Mossback')).not.toBeNull();

  await settleTick(page); // roll 1 — still full of it (and this is the roll that floats the glance)
  expect(await struck(page, 'Mossback')).not.toBeNull();
  await settleTick(page); // roll 2 — the window closes
  expect(await struck(page, 'Mossback')).toBeNull();
  await settleTick(page);
  expect(await struck(page, 'Mossback')).toBeNull();
});

test('the ticker names the ground once per crossing, not once per glance', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Glade', 'grove'));
  await settleTick(page);
  await settleTick(page);

  const glances = (await events(page)).filter((e) => e.includes('Glade') && e.includes('glancing back'));
  expect(glances).toHaveLength(1);
  expect(glances[0]).toContain('Pocket Cretaceous');
  expect(glances[0]).toContain('🌾');
});

test('the book reads it while it lasts, and only for the dino that just crossed', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));

  let rows = await bookRows(page);
  expect(rows.find((r) => r.name === 'Rex')!.struck).toBe('just back from Pocket Cretaceous');
  expect(rows.find((r) => r.name === 'Sunny')!.struck).toBeUndefined();
  expect(await page.evaluate(() => (window as W).__bookText() as string)).toContain('just back from');

  await settleTick(page);
  await settleTick(page);
  rows = await bookRows(page);
  expect(rows.find((r) => r.name === 'Rex')!.struck).toBeUndefined();
});

test('a homecoming is not a visit — the 🏡 beat keeps that moment to itself', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setRoot('Mossback', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Mossback', 'fernreach'));
  // walk it home: startMigration + steps, so crossDino's homecoming branch runs
  await page.evaluate(() => (window as W).__startMigrationTo('Mossback', 'grove'));
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    if (await page.evaluate(() => (window as W).__homeZone('Mossback') === 'grove')) break;
  }
  expect(await page.evaluate(() => (window as W).__homeZone('Mossback'))).toBe('grove');
  expect(await struck(page, 'Mossback')).toBeNull(); // resettled at SETTLE_ROLLS — home, not visiting
});

test('the record survives a reload', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  const before = await struck(page, 'Mossback');

  await page.reload();
  await page.waitForFunction(() => (window as W).__ready === true);
  expect(await struck(page, 'Mossback')).toEqual(before);
});
