import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A ground you come to miss (BACKLOG-362) — Milestone 10's closing lore arc, and the park's first
 * migration *pull*. Every other bias is a push: scarcity empties the poorest ground, a hollowing one
 * hurries its stragglers out, a dry pantry sends a mouth toward a fuller one. These prove the opposite —
 * a dino leaving because somewhere it has stood got under its skin.
 *
 * Roster curiosity (name-seeded, stable): Mossback 0.24 → the 3-day fuse; Rex 0.61 → the curious 2-day one.
 */

type W = Record<string, any>;

const leftDays = (p: Page) => p.evaluate(() => (window as W).__leftDays() as Record<string, Record<string, number>>);
const yearnDest = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__yearnDest(n) as string | null, name);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const memoryOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const day = (p: Page) => p.evaluate(() => (window as W).__clockNow().day as number);
const setDay = (p: Page, d: number) => p.evaluate((dd) => (window as W).__setClock(dd, 8, 0), d);

test('a dino that has never left anywhere misses nothing — day one is silent', async ({ page }) => {
  await boot(page);
  expect(await leftDays(page)).toEqual({});
  expect(await yearnDest(page, 'Mossback')).toBeNull();
  await page.evaluate(() => (window as W).__seedYearning());
  expect((await memoryOf(page, 'Mossback')).some((m) => m.includes('💭'))).toBe(false);
});

test('crossing out of a ground starts its clock, and arriving somewhere stops that one', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));

  const stamps = (await leftDays(page)).Mossback;
  expect(stamps.bowl).toBe(await day(page)); // the bowl it just left is now counting
  expect(stamps.grove).toBeUndefined(); // you cannot miss where you are standing

  await page.evaluate(() => (window as W).__migrate('Mossback', 'bowl'));
  const back = (await leftDays(page)).Mossback;
  expect(back.grove).toBe(await day(page));
  expect(back.bowl).toBeUndefined();
});

test('a ground left long enough starts calling, and the longing is filed once', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  const left = await day(page);

  await setDay(page, left + 2);
  expect(await yearnDest(page, 'Mossback')).toBeNull(); // Mossback is a homebody: three days, not two

  await setDay(page, left + 3);
  expect(await yearnDest(page, 'Mossback')).toBe('bowl');

  await page.evaluate(() => (window as W).__seedYearning());
  await page.evaluate(() => (window as W).__seedYearning());
  const longing = (await memoryOf(page, 'Mossback')).filter((m) => m.includes('💭'));
  expect(longing).toHaveLength(1);
  expect(longing[0]).toContain('Pocket Cretaceous');
});

test('a curious dino misses a ground a day sooner than a homebody', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  const left = await day(page);

  await setDay(page, left + 2);
  expect(await yearnDest(page, 'Rex')).toBe('bowl'); // curiosity 0.61 → the short fuse
  expect(await yearnDest(page, 'Mossback')).toBeNull();
});

test('the longing takes the migrant pick and aims it at the missed ground, not the richest one', async ({ page }) => {
  await boot(page);
  // Everyone into the grove, so the bowl is the ground they have all just left.
  for (const n of ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade']) {
    await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
  const left = await day(page);
  await setDay(page, left + 4);

  // Make the Fernreach the richest neighbour the appeal read can see, so the pick has something to lose to.
  await page.evaluate(() => (window as W).__setZonePile('fernreach', { frond: 6, branch: 6, stone: 6 }));

  const picked = await page.evaluate(() => (window as W).__maybeMigrate() as string | null);
  expect(picked).not.toBeNull();
  expect(await yearnDest(page, picked!)).toBe('bowl');

  const log = (await events(page)).join('\n');
  expect(log).toMatch(/💭 .+ misses Pocket Cretaceous — heads back/);
  // A longing is not a scarcity move: 457's greener-ground line must stay silent.
  expect(log).not.toMatch(/pantry ran dry/);
});

test('the book reads the longing, and only for a dino that has one', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  await setDay(page, (await day(page)) + 4);
  await page.evaluate(() => (window as W).__seedYearning());

  const rows = await page.evaluate(() => (window as W).__bookRows() as Array<{ name: string; yearn?: string }>);
  expect(rows.find((r) => r.name === 'Mossback')!.yearn).toBe('misses Pocket Cretaceous');
  expect(rows.find((r) => r.name === 'Sunny')!.yearn).toBeUndefined();
  expect(await page.evaluate(() => (window as W).__bookText() as string)).toContain('misses Pocket Cretaceous');
});

test('the departure clock survives a reload', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  const before = await leftDays(page);

  // BACKLOG-486 (rework 2): `__migrate` auto-saves fire-and-forget (`void this.saveGame()`), so under
  // parallel load the reload can beat the IndexedDB write and the spec reads a save that was never written.
  // The 456 precedent: settle it first. This is the race, not the persistence.
  await page.evaluate(() => (window as W).__flushSave());
  await page.reload();
  await page.waitForFunction(() => (window as W).__ready === true);
  expect(await leftDays(page)).toEqual(before);
});
