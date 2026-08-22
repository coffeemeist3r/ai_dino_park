import { test, expect, type Page } from '@playwright/test';
import { boot, emptyGrounds } from './helpers';

/**
 * More than one voice on the call (BACKLOG-479). A ground's council is derived from the same banked-food
 * tallies that crown its provider — so it is empty park-wide until somebody actually fills a pantry, and
 * the provider is always the first voice seated.
 */

type W = Record<string, any>;

const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);
const zoneMap = (p: Page) => p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; council: string[] }>);
const mapText = (p: Page) => p.evaluate(() => ((window as W).__zoneMapText() as string[]).join(' | '));
const zoneOfDino = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);

test('a fresh park seats nobody anywhere; banking food seats a voice', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await emptyGrounds(page); // BACKLOG-492: the founding Grove now seats a council; this spec's subject is not the founding state

  // The inertness criterion: nothing about this feature is live on a new save.
  const fresh = await councils(page);
  expect(Object.values(fresh).every((seats) => seats.length === 0)).toBe(true);
  expect(await mapText(page)).not.toContain('👥');

  const [first] = await page.evaluate(() =>
    ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name),
  );
  await page.evaluate((n) => (window as W).__creditBank(n, 2), first);

  const zone = await zoneOfDino(page, first);
  expect((await councils(page))[zone]).toEqual([first]);
  expect((await zoneMap(page)).find((e) => e.id === zone)!.council).toEqual([first]);
  expect(await mapText(page)).toContain('👥1');

  // ...and the seat reads in the book, on the dino that holds it.
  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('👥 one of');

  expect(errors).toEqual([]);
});

test('the provider is always the first voice seated', async ({ page }) => {
  await boot(page);
  await emptyGrounds(page); // BACKLOG-492: the founding Grove now seats a council; this spec's subject is not the founding state

  const roster = await page.evaluate(() =>
    ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name),
  );
  // Bank everyone in the starting ground, the eventual provider hardest.
  for (const n of roster) await page.evaluate((nn) => (window as W).__creditBank(nn, 1), n);
  await page.evaluate((n) => (window as W).__creditBank(n, 5), roster[1]);

  const zone = await zoneOfDino(page, roster[1]);
  const provider = await page.evaluate((z) => (window as W).__zoneProvider(z) as string | null, zone);
  expect(provider).toBe(roster[1]);
  expect((await councils(page))[zone][0]).toBe(provider);
});
