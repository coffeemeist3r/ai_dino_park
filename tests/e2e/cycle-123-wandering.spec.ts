import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Homebody or wanderer (BACKLOG-361) — Milestone 11's second lore arc. The park has recorded crossings as
 * facts for fifty cycles and never counted them; this is the lifetime read that falls out when it does.
 *
 * The two dimensions are the point: crossings (how often) and reach (how far from where it began). A dino
 * that shuttles next door forever stays a rambler; one that reaches the far end of the chain is a wanderer.
 */

type W = Record<string, any>;

const crossings = (p: Page) => p.evaluate(() => (window as W).__crossings() as Record<string, number>);
const bookRows = (p: Page) =>
  p.evaluate(() => (window as W).__bookRows() as Array<{ name: string; wander?: string }>);
const wanderOf = async (p: Page, name: string) => (await bookRows(p)).find((r) => r.name === name)!.wander;

test('a fresh park is all homebodies, each named for its own ground', async ({ page }) => {
  await boot(page);
  expect(await crossings(page)).toEqual({});
  // CHARTER v7: still all homebodies — nobody has crossed anything yet — but they are homebodies of three
  // different grounds, so the line names each dino's own home rather than the one zone everybody shared.
  const homes = new Set<string>();
  for (const row of await bookRows(page)) {
    expect(row.wander).toMatch(/^a homebody — never left .+/);
    homes.add(row.wander!);
  }
  expect(homes.size).toBeGreaterThan(1);
  expect(await page.evaluate(() => (window as W).__bookText() as string)).toContain('a homebody');
});

test('the instant path counts exactly one crossing per arrival', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  expect((await crossings(page)).Mossback).toBe(1);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'fernreach'));
  expect((await crossings(page)).Mossback).toBe(2);
  // nobody else moved
  expect((await crossings(page)).Sunny).toBeUndefined();
});

test('being sent to the ground you already stand on is not a journey', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Glade', 'grove'));
  expect((await crossings(page)).Glade).toBe(1);
  await page.evaluate(() => (window as W).__migrate('Glade', 'grove'));
  expect((await crossings(page)).Glade).toBe(1);
});

test('a walked crossing counts once too', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__startMigrationTo('Rex', 'grove'));
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    if (await page.evaluate(() => (window as W).__homeZone('Rex') === 'grove')) break;
  }
  expect(await page.evaluate(() => (window as W).__homeZone('Rex'))).toBe('grove');
  expect((await crossings(page)).Rex).toBe(1);
});

test('moving a lot and going nowhere is a rambler; reaching the far end is a wanderer', async ({ page }) => {
  await boot(page);
  // Sunny shuttles: four crossings, never more than one ground out
  for (const z of ['grove', 'bowl', 'grove', 'bowl']) {
    await page.evaluate((zone) => (window as W).__migrate('Sunny', zone), z);
  }
  expect((await crossings(page)).Sunny).toBe(4);
  expect(await wanderOf(page, 'Sunny')).toBe('a rambler — 4 crossings, 1 ground out');

  // Twitch walks the chain: fewer crossings, but it has stood at the far end
  for (const z of ['grove', 'fernreach', 'hollow']) {
    await page.evaluate((zone) => (window as W).__migrate('Twitch', zone), z);
  }
  expect(await wanderOf(page, 'Twitch')).toBe('a wanderer — 3 crossings, 3 grounds out');
});

test('the standing only ever grows, and survives a reload', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Mossback', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Mossback', 'fernreach'));
  const before = await wanderOf(page, 'Mossback');
  expect(before).toContain('2 crossings');

  // BACKLOG-486 (rework 2): `__migrate` auto-saves fire-and-forget (`void this.saveGame()`), so under
  // parallel load the reload can beat the IndexedDB write and the spec reads a save that was never written.
  // The 456 precedent: settle it first. This is the race, not the persistence.
  await page.evaluate(() => (window as W).__flushSave());
  await page.reload();
  await page.waitForFunction(() => (window as W).__ready === true);
  expect((await crossings(page)).Mossback).toBe(2);
  expect(await wanderOf(page, 'Mossback')).toBe(before);
});
