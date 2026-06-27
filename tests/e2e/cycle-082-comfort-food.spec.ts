import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Comfort food (BACKLOG-374). A moping loner soothed by its *favorite* food gets a quiet 😌 solace beat a
 * plain meal never gives. A fresh bowl is all-unbonded, so every dino is a loner; `__eat` forces a named
 * dino to eat the food in play (deterministic eater past the swarm race).
 */

type W = Record<string, any>;
const FOOD_IDS = ['meat', 'greens', 'fish', 'berries'];

const fav = (p: Page, n: string) => p.evaluate((name) => (window as W).__favoriteFood(name).id as string, n);
const isLoner = (p: Page, n: string) => p.evaluate((name) => (window as W).__isLoner(name) as boolean, n);
const comfort = (p: Page) => p.evaluate(() => (window as W).__lastComfortFood() as { name: string; food: string } | null);
const mem = (p: Page, n: string) =>
  p.evaluate((name) => ((window as W).__memory() as Record<string, string[]>)[name] ?? [], n);

async function dropAndEat(p: Page, name: string, foodId: string) {
  await p.evaluate((id) => (window as W).__dropFood(0, id), foodId);
  await p.evaluate((nm) => (window as W).__eat(nm), name);
}

test('a loner eating its favorite gets a 😌 comfort beat + a distinct memory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  const target = (await page.evaluate(() => (window as W).__dinoPositions()))[0].name as string;
  expect(await isLoner(page, target)).toBe(true); // fresh bowl: unbonded
  const favId = await fav(page, target);

  await dropAndEat(page, target, favId);

  expect(await comfort(page)).toEqual({ name: target, food: favId });
  const lines = await mem(page, target);
  expect(lines.some((m) => m.includes('comfort food') && m.includes('😌'))).toBe(true);
  expect(errors).toEqual([]);
});

test('a loner eating a non-favorite food gets no comfort beat', async ({ page }) => {
  await boot(page);
  const target = (await page.evaluate(() => (window as W).__dinoPositions()))[0].name as string;
  const favId = await fav(page, target);
  const nonFav = FOOD_IDS.find((f) => f !== favId)!;

  await dropAndEat(page, target, nonFav);

  expect(await comfort(page)).toBeNull();
  const lines = await mem(page, target);
  expect(lines.some((m) => m.includes('scrambled to the hatch'))).toBe(true); // plain-feed memory
  expect(lines.some((m) => m.includes('😌'))).toBe(false);
});

test('a well-bonded (non-loner) dino eating its favorite gets no comfort — just the normal favorite beat', async ({ page }) => {
  await boot(page);
  const target = (await page.evaluate(() => (window as W).__dinoPositions()))[0].name as string;
  await page.evaluate((nm) => (window as W).__bondPair(nm, nm === 'Rex' ? 'Sunny' : 'Rex', 30), target);
  expect(await isLoner(page, target)).toBe(false);
  const favId = await fav(page, target);

  await dropAndEat(page, target, favId);

  expect(await comfort(page)).toBeNull();
  const lines = await mem(page, target);
  expect(lines.some((m) => m.includes('your favorite'))).toBe(true); // still the favorite eat
  expect(lines.some((m) => m.includes('comfort food'))).toBe(false);
});
