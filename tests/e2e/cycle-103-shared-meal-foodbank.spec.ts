import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Cycle 103 — Milestone 5 opener.
 *
 * Lore (BACKLOG-373 · shared meal): two *different* dinos eating within a short window bond over the meal —
 * a small tie + an "ate together" memory each. Driven via __dropFood/__eat, asserted on __bond/__events.
 *
 * Structure (BACKLOG-446 · a zone banks its harvest): a share of each harvest banks into the zone's own food
 * store (capped), read on the zone-map lens. Driven via the plant/clock/harvest hooks, asserted on
 * __zoneFoodPile + __zoneMap's `banked` line.
 */

type W = Record<string, any>;

const bond = (p: Page, a: string, b: string) => p.evaluate(({ a, b }) => (window as W).__bond(a, b) as number, { a, b });
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const eatDrop = async (p: Page, name: string) => {
  await p.evaluate(() => (window as W).__dropFood());
  await p.evaluate((n) => (window as W).__eat(n), name);
};

test('two different dinos eating within the window share a meal (BACKLOG-373)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const before = await bond(page, 'Rex', 'Twitch');
  await eatDrop(page, 'Rex');
  await eatDrop(page, 'Twitch'); // immediately after → within the shared-meal window

  const lastMeal = await page.evaluate(() => (window as W).__lastMeal() as { name: string } | null);
  expect(lastMeal?.name).toBe('Twitch');
  expect(await bond(page, 'Rex', 'Twitch')).toBe(before + 3); // SHARED_MEAL_BOND
  expect((await events(page)).some((e) => e.includes('🍽') && e.includes('ate together'))).toBe(true);

  expect(errors).toEqual([]);
});

test('the same dino eating twice does not self-pair (BACKLOG-373)', async ({ page }) => {
  await boot(page);
  const rexTwitch = await bond(page, 'Rex', 'Twitch');
  await eatDrop(page, 'Rex');
  await eatDrop(page, 'Rex'); // same dino → no shared meal
  // no bond anywhere moved by a self-meal, and no "ate together" event fired
  expect(await bond(page, 'Rex', 'Twitch')).toBe(rexTwitch);
  expect((await events(page)).some((e) => e.includes('ate together'))).toBe(false);
});

const ripen = async (page: Page, zone: string) => {
  const planted = await page.evaluate((z) => (window as W).__plantPlot(z), zone);
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await page.evaluate((z) => (window as W).__plot(z), zone)).stage).toBe('ripe');
};

test('harvesting banks a share into the zone food store and reads on the lens (BACKLOG-446)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__zoneFoodPile('bowl'))).toEqual({}); // empty before

  await ripen(page, 'bowl');
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));

  // banked one berry, and the drop into the feeding loop is unchanged
  expect((await page.evaluate(() => (window as W).__zoneFoodPile('bowl'))).berries).toBe(1);
  expect((await page.evaluate(() => (window as W).__food())).foodId).toBe('berries');

  // and it reads on the zone-map lens
  const bowl = (await page.evaluate(() => (window as W).__zoneMap())).find((e: any) => e.id === 'bowl');
  expect(bowl.banked).toBe('🍓 1');

  expect(errors).toEqual([]);
});
