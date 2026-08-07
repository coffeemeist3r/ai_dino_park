import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Both of the ground's calls, on the lens (BACKLOG-477) — the two governance glyphs come off the end of
 * the prosperity line and onto one table-driven row, with a legend in the [?] panel so they're decodable.
 *
 * The pure half (the table, the folded row, the placeholder, the legend) is unit-covered in
 * `game/src/world/governance.test.ts`. This proves what is actually *drawn*: `__zoneMapText` reads the
 * rendered label, not the model, so a regression that leaves the model right and the box wrong is caught.
 */

type W = Record<string, any>;

const mapText = (p: Page) => p.evaluate(() => (window as W).__zoneMapText() as string[]);
const helpText = (p: Page) => p.evaluate(() => (window as W).__helpText() as string);
const spendPriority = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__spendPriority(z) as 'feed' | 'bank' | null, zone);
const workPriority = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__workPriority(z) as 'gather' | 'build' | null, zone);
const roles = (p: Page) => p.evaluate(() => (window as W).__roles() as Record<string, string>);
const dinoNames = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

const GLYPHS = ['🍽️', '🏦', '🧺', '🧱', '▫'];

async function harvestBowl(page: Page) {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

async function onlyResident(page: Page, keep: string) {
  for (const n of await dinoNames(page)) {
    if (n !== keep) await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
}

test('the [?] panel explains every glyph the governance row can draw', async ({ page }) => {
  await boot(page);
  const text = await helpText(page);
  // still the controls reference it has always been
  expect(text).toContain('— Controls —');
  expect(text).toContain('friendship hearts');
  // and now a legend for the map's governance row
  expect(text).toContain('How a ground decides');
  for (const g of GLYPHS) expect(text).toContain(g);
});

test("a ground's calls fold into one row on the zone map, and nothing before one is set", async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // A young park has decided nothing anywhere — no box carries a governance glyph at all.
  const before = (await mapText(page)).join('\n');
  for (const g of GLYPHS) expect(before).not.toContain(g);

  const [keeperDino] = await dinoNames(page);
  await onlyResident(page, keeperDino);
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await roles(page))[keeperDino]).toBe('provider');

  const boxes = await mapText(page);
  const bowlBox = boxes.find((t) => t.startsWith('Pocket Cretaceous'))!;
  expect(bowlBox).toBeTruthy();

  // Both calls read on the box, on a line of their own — and neither is stuck on the tail of the
  // prosperity line any more (that line ends with the harvest tally).
  const spend = await spendPriority(page, 'bowl');
  const work = await workPriority(page, 'bowl');
  const govRow = bowlBox.split('\n').find((l) => GLYPHS.some((g) => l.includes(g)))!;
  expect(govRow).toBeTruthy();
  expect(govRow).toContain(spend === 'feed' ? '🍽️' : '🏦');
  expect(govRow).toContain(work === 'gather' ? '🧺' : '🧱');
  const prosperityRow = bowlBox.split('\n')[2];
  for (const g of GLYPHS) expect(prosperityRow).not.toContain(g);

  expect(errors).toEqual([]);
});
