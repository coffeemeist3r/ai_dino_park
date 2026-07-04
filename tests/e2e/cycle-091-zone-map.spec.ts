import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Zone map lens (BACKLOG-425). The V ring gains a map page: the whole zone chain drawn from the
 * adjacency table, each zone a labelled box with its live head count, the keeper's zone dotted —
 * the bigger world visible as a world, not inferred one edge at a time.
 */

type W = Record<string, any>;
type Entry = { id: string; name: string; count: number; keeper: boolean };

const zoneMap = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__zoneMap() as Entry[]);

test('cycling V reaches the map after the ticker', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const lens = await page.evaluate(() => {
    const cycle = (window as W).__cycleLens as () => string;
    cycle(); // book
    cycle(); // bonds
    cycle(); // roles
    cycle(); // ticker
    return cycle(); // map
  });
  expect(lens).toBe('map');
  expect(errors).toEqual([]);
});

test('the map shows the whole chain with the roster counted at home', async ({ page }) => {
  await boot(page);

  const model = await zoneMap(page);
  expect(model.map((e) => e.id)).toEqual(['bowl', 'grove', 'fernreach']);
  expect(model.map((e) => e.name)).toEqual(['Pocket Cretaceous', 'The Grove', 'The Fernreach']);
  // every dino is counted somewhere, and the fresh-boot cast starts in the bowl
  const roster = await page.evaluate(() => ((window as W).__bookRows as () => unknown[])().length);
  expect(model.reduce((s, e) => s + e.count, 0)).toBe(roster);
  expect(model[0].count).toBe(roster);
  // the keeper starts in the bowl
  expect(model.map((e) => e.keeper)).toEqual([true, false, false]);
});

test('the keeper dot follows a real crossing', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => {
    (window as W).__setPlayer(630, 240);
    (window as W).__tryCross();
  });
  expect(await page.evaluate(() => (window as W).__zone())).toBe('grove');
  const model = await zoneMap(page);
  expect(model.map((e) => e.keeper)).toEqual([false, true, false]);
});
