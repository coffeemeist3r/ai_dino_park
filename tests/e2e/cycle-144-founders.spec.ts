import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Record a founding as a founding (BACKLOG-512).
 *
 * `isUnsettled` asked "no residents, no pioneer, and not the origin", and the origin clause named one id
 * because 343 records a pioneer at *arrival* and nothing recorded one at spawn. CHARTER v7's spread cast
 * made that wrong four more times: five grounds hold residents from the first frame and none of them had a
 * founder, so any of them read as virgin frontier the moment it emptied. The exemption is gone and the
 * record is true instead — which is also what puts a founding standing in the book on the first frame.
 */

type W = Record<string, any>;
type Standing = { zone: string; kind: string; holders: string[] };

const standings = (p: Page) => p.evaluate(() => (window as W).__standings() as Standing[]);
const unsettled = (p: Page) => p.evaluate(() => (window as W).__unsettled() as string[]);
const hollowed = (p: Page) => p.evaluate(() => (window as W).__hollowed() as string[]);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);

test('every ground the roster wakes on names a founder, from the first frame', async ({ page }) => {
  await boot(page);
  const pioneers = (await standings(page)).filter((s) => s.kind === 'pioneer');
  const grounds = pioneers.map((s) => s.zone).sort();

  // Before this item a fresh save had a pioneer standing for nobody at all — nobody had *arrived* anywhere.
  expect(grounds).toEqual(['bowl', 'fernreach', 'grove', 'hollow', 'ridge']);
  expect(pioneers.find((s) => s.zone === 'grove')!.holders[0]).toBe('Bramble');
  expect(pioneers.find((s) => s.zone === 'hollow')!.holders[0]).toBe('Murk');
  expect(pioneers.find((s) => s.zone === 'ridge')!.holders[0]).toBe('Ember');

  // The Saltpan is the one ground nobody founded, which is what keeps it the park's only frontier.
  expect(pioneers.some((s) => s.zone === 'saltpan')).toBe(false);
});

test('the book shows a Grove resident as its founder on a fresh save', async ({ page }) => {
  await boot(page);
  const text = await page.evaluate(() => (window as W).__bookText() as string);
  expect(text).toContain('first across into the Grove'); // BACKLOG-499 wording
});

test('seeding the founders posts nothing — the boot ticker gains no founding beats', async ({ page }) => {
  await boot(page);
  // `recordPioneer`, not `foundZone`: five 343 arrival announcements at boot would be a worse lie than the
  // one this item fixes.
  expect((await events(page)).filter((e) => e.includes('first ever to set foot'))).toEqual([]);
});

test('exactly one ground reads unsettled, and none reads hollowed, at boot', async ({ page }) => {
  await boot(page);
  expect(await unsettled(page)).toEqual(['saltpan']);
  expect(await hollowed(page)).toEqual([]);
});

test('a ground its cast has lived on since frame zero reads hollowed when it empties, not unsettled', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));

  expect(await unsettled(page)).toEqual(['saltpan']); // ...and NOT ['hollow'], which is the whole item
  expect(await hollowed(page)).toEqual(['hollow']);

  const log = (await events(page)).join('\n');
  expect(log).toMatch(/🕸️ the Hollow stands empty — Murk settled it, and nobody is left/);

  // The lens says which kind of empty it is, rather than reading as a poor ground with nobody drawn on it.
  const entry = await page.evaluate(
    () => (window as W).__zoneMap().find((e: any) => e.id === 'hollow') as { unsettled: boolean; hollowed: boolean },
  );
  expect(entry.unsettled).toBe(false);
  expect(entry.hollowed).toBe(true);
});

test('the hollowed beat sounds once, and again only after the ground repopulates and empties', async ({ page }) => {
  await boot(page);
  const count = async () => (await events(page)).filter((e) => e.includes('stands empty')).length;

  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));
  await hollowed(page);
  await hollowed(page); // a second read of an already-announced ground says nothing more
  expect(await count()).toBe(1);

  await page.evaluate(() => (window as W).__migrate('Murk', 'hollow'));
  await hollowed(page);
  await page.evaluate(() => (window as W).__migrate('Murk', 'fernreach'));
  await hollowed(page);
  expect(await count()).toBe(2);
});
