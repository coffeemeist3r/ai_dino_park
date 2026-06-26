import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * First sight of the pond (BACKLOG-359). The first time a grove dino comes within sight of the pond
 * water (NE of the grove) it stops wide-eyed — a 💧 "first saw the pond" memory + bubble — once per
 * dino ever. A DISTINCT beat from the grove-entry one (339): keyed on pond proximity, not zone entry.
 * `__seePond` drops a dino into the grove beside the water and runs the check.
 */

type W = Record<string, any>;

const pondSeen = (p: Page) => p.evaluate(() => (window as W).__pondSeen() as string[]);
const groveVisited = (p: Page) => p.evaluate(() => (window as W).__groveVisited() as string[]);
const memOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);

test('a grove dino reaching the pond sees it — once, ever', async ({ page }) => {
  await boot(page);

  expect(await pondSeen(page)).not.toContain('Rex');

  // First sight: Rex, dropped into the grove beside the pond, files the 💧 memory.
  await page.evaluate(() => (window as W).__seePond('Rex'));
  expect(await pondSeen(page)).toContain('Rex');
  expect((await memOf(page, 'Rex')).some((m) => m.includes('first saw the pond'))).toBe(true);

  // Once ever: a second sighting adds no duplicate.
  await page.evaluate(() => (window as W).__seePond('Rex'));
  expect((await pondSeen(page)).filter((n) => n === 'Rex').length).toBe(1);
  expect((await memOf(page, 'Rex')).filter((m) => m.includes('first saw the pond')).length).toBe(1);
});

test('the pond-sight beat is distinct from the grove-entry beat (BACKLOG-359 vs 339)', async ({ page }) => {
  await boot(page);

  // Seeing the pond does not, by itself, file the 339 "first time across" grove-entry memory —
  // the two are separate beats with separate memories and separate once-ever sets.
  await page.evaluate(() => (window as W).__seePond('Sunny'));
  expect(await pondSeen(page)).toContain('Sunny');
  expect((await memOf(page, 'Sunny')).some((m) => m.includes('first saw the pond'))).toBe(true);
  expect((await memOf(page, 'Sunny')).some((m) => m.includes('first time across'))).toBe(false);
  expect(await groveVisited(page)).not.toContain('Sunny');
});
