import { test, expect } from '@playwright/test';
import { boot, gatherToBowl } from './helpers';

/**
 * Zone indicator (BACKLOG-316). The plaque gains a per-zone tally line — each zone's name + resident
 * count, with a ▸ marker on the keeper's active zone — so the split world is legible without walking it.
 */

type W = Record<string, any>;

const tally = (p: import('@playwright/test').Page) =>
  p.evaluate(() => ((window as W).__plaque() as { zoneTally: string }).zoneTally);

test('the plaque shows the active zone marked and the per-zone population', async ({ page }) => {
  await boot(page);

  // CHARTER v7: the keeper starts in the bowl and the bowl is marked, but the grove is no longer empty —
  // the plaque's per-zone tally finally has more than one non-zero number to show.
  let t = await tally(page);
  expect(t).toMatch(/▸Pocket Cretaceous [1-9]\d* · The Grove [1-9]\d*/);

  // Walking into the grove moves the marker.
  await page.evaluate(() => (window as W).__setZone('grove'));
  t = await tally(page);
  expect(t).toContain('▸The Grove');
  expect(t).not.toContain('▸Pocket Cretaceous');

  // Migrating a dino into the grove updates the counts: the grove gains a resident.
  await page.evaluate(() => (window as W).__setZone('bowl'));
  await gatherToBowl(page); // CHARTER v7: empty the grove so the migration below moves it 0 → 1 exactly
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  t = await tally(page);
  expect(t).toContain('The Grove 1');
  expect(t).not.toContain('The Grove 0');
});
