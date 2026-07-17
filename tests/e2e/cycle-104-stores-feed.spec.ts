import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A carrier feeds the hungry (BACKLOG-444) — Milestone 5 structure arc 2. The food 446 banked can finally
 * be spent: a zone's stores feed its own starving resident, but only as a last resort — never while a
 * keeper drop is in play, never from an empty pantry, and never at the merely-hungry bar (which is where
 * 376's dawn beat and 436's need-pull live).
 *
 * Driven via __setZoneFoodPile / __setNeed / __checkNeeds, asserted on __zoneFoodPile + __needs + __events.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const hunger = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__needs() as Record<string, { hunger: number }>)[n]?.hunger ?? 0, name);
const foodPile = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneFoodPile(z) as Record<string, number>, zone);
const setFoodPile = (p: Page, zone: string, pile: Record<string, number>) =>
  p.evaluate(({ zone, pile }) => (window as W).__setZoneFoodPile(zone, pile), { zone, pile });
const setNeed = (p: Page, name: string, v: number) =>
  p.evaluate(({ name, v }) => (window as W).__setNeed(name, 'hunger', v), { name, v });
const checkNeeds = (p: Page) => p.evaluate(() => (window as W).__checkNeeds());
const fedLines = (log: string[]) => log.filter((e) => e.includes('stores fed'));

test("a starving resident is fed from its zone's banked food (BACKLOG-444)", async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await setFoodPile(page, 'bowl', { berries: 2 });
  await setNeed(page, 'Rex', 0.95);

  await checkNeeds(page);

  expect(await hunger(page, 'Rex')).toBe(0);
  expect(await foodPile(page, 'bowl')).toEqual({ berries: 1 }); // exactly one unit spent

  const lines = fedLines(await events(page));
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('Rex');
  expect(lines[0]).toContain('Pocket Cretaceous'); // the bowl's display name — the ticker names the zone

  expect(errors).toEqual([]);
});

test('a merely-hungry dino is left to its hunger — the stores are a last resort (BACKLOG-444)', async ({ page }) => {
  await boot(page);

  await setFoodPile(page, 'bowl', { berries: 2 });
  await setNeed(page, 'Rex', 0.7); // pressing (376/436 territory), not starving

  await checkNeeds(page);

  expect(await hunger(page, 'Rex')).toBeGreaterThan(0.7); // it climbed; it was not reset
  expect(await foodPile(page, 'bowl')).toEqual({ berries: 2 }); // pantry untouched
  expect(fedLines(await events(page))).toEqual([]);
});

test('an empty pantry feeds no one (BACKLOG-444)', async ({ page }) => {
  await boot(page);

  await setFoodPile(page, 'bowl', {});
  await setNeed(page, 'Rex', 0.95);

  await checkNeeds(page);

  expect(await hunger(page, 'Rex')).toBeGreaterThan(0.9); // still starving
  expect(fedLines(await events(page))).toEqual([]);
});

test('a keeper drop in play always wins — the stores wait their turn (BACKLOG-444)', async ({ page }) => {
  await boot(page);

  await setFoodPile(page, 'bowl', { berries: 2 });
  await setNeed(page, 'Rex', 0.95);
  await page.evaluate(() => (window as W).__dropFood());

  await checkNeeds(page);

  expect(await foodPile(page, 'bowl')).toEqual({ berries: 2 }); // pantry untouched while food is down
  expect(fedLines(await events(page))).toEqual([]);
  expect(await hunger(page, 'Rex')).toBeGreaterThan(0.9);

  // once the drop is gone, the next tick feeds it
  await page.evaluate(() => (window as W).__eat('Rex'));
  await setNeed(page, 'Rex', 0.95); // eating sated it; re-starve to isolate the stores path
  await checkNeeds(page);

  expect(await hunger(page, 'Rex')).toBe(0);
  expect(await foodPile(page, 'bowl')).toEqual({ berries: 1 });
});

test("the spend comes from the dino's home zone, not the one the keeper is looking at (BACKLOG-444)", async ({ page }) => {
  await boot(page);

  await setFoodPile(page, 'bowl', { berries: 2 }); // Rex's home zone
  await setFoodPile(page, 'grove', { greens: 3 });
  await setNeed(page, 'Rex', 0.95);
  await page.evaluate(() => (window as W).__setZone('grove')); // keeper walks off to the grove

  await checkNeeds(page);

  expect(await foodPile(page, 'bowl')).toEqual({ berries: 1 }); // fed from home
  expect(await foodPile(page, 'grove')).toEqual({ greens: 3 }); // the viewed zone's pantry is untouched
});
