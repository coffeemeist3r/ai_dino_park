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
  // BACKLOG-472: the chain is four grounds deep now, ending in The Hollow.
  // BACKLOG-478: the branch is appended after the trunk — chain order is iteration order, not geography.
  // BACKLOG-505: the trunk runs one further east, to the frontier.
  expect(model.map((e) => e.id)).toEqual(['bowl', 'grove', 'fernreach', 'hollow', 'saltpan', 'ridge']);
  expect(model.map((e) => e.name)).toEqual([
    'Pocket Cretaceous',
    'The Grove',
    'The Fernreach',
    'The Hollow',
    'The Saltpan',
    'The Sunward Ridge',
  ]);
  // Every dino is counted somewhere — the invariant that actually matters, and the one a single-zone park
  // could never distinguish from "they are all in box one". CHARTER v7 spreads the cast, so the total still
  // reconciles but the bowl no longer holds all of it.
  const roster = await page.evaluate(() => ((window as W).__bookRows as () => unknown[])().length);
  expect(model.reduce((s, e) => s + e.count, 0)).toBe(roster);
  expect(model[0].count).toBeLessThan(roster); // the bowl is a ground, not the park
  expect(model.filter((e) => e.count > 0).length).toBeGreaterThan(1);
  // the keeper starts in the bowl
  expect(model.map((e) => e.keeper)).toEqual([true, false, false, false, false, false]); // BACKLOG-478/505
});

test('the keeper dot follows a real crossing', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => {
    (window as W).__setPlayer(630, 240);
    (window as W).__tryCross();
  });
  expect(await page.evaluate(() => (window as W).__zone())).toBe('grove');
  const model = await zoneMap(page);
  expect(model.map((e) => e.keeper)).toEqual([false, true, false, false, false, false]); // BACKLOG-478/505
});
