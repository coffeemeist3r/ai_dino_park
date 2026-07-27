import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The lean season (BACKLOG-461) — the turning year grips the food economy. The lean season (winter) lowers a
 * zone's food cap and quickens spoilage; the plenty seasons (summer/fall) raise the cap and ease spoilage.
 * Driven through the real food-cap + `runSpoilage` paths via the __setClock / __foodCap / __spoilFood hooks.
 * Days: spring 1–7, summer 8–14, fall 15–21, winter 22–28 (SEASON_LENGTH_DAYS = 7).
 */

type W = Record<string, any>;

const setClock = (p: Page, day: number) => p.evaluate((d) => (window as W).__setClock(d, 12, 0), day);
const season = (p: Page) => p.evaluate(() => (window as W).__season() as string);
const foodCap = (p: Page, zone: string) => p.evaluate((z) => (window as W).__foodCap(z) as number, zone);
const setPile = (p: Page, zone: string, pile: Record<string, number>) =>
  p.evaluate(({ zone, pile }) => (window as W).__setZoneFoodPile(zone, pile), { zone, pile });
const spoil = (p: Page) => p.evaluate(() => (window as W).__spoilFood() as Record<string, Record<string, number>>);
const foodPile = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneFoodPile(z) as Record<string, number>, zone);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);

test('the season shifts a zone food cap: lean below, plenty above, spring at the base', async ({ page }) => {
  await boot(page);
  await setClock(page, 1); // spring
  expect(await season(page)).toBe('spring');
  const springCap = await foodCap(page, 'grove');

  await setClock(page, 22); // winter — lean
  expect(await season(page)).toBe('winter');
  expect(await foodCap(page, 'grove')).toBe(springCap - 1);

  await setClock(page, 8); // summer — plenty
  expect(await season(page)).toBe('summer');
  expect(await foodCap(page, 'grove')).toBe(springCap + 1);
});

test('winter bleeds a hoard sooner and deeper than spring would', async ({ page }) => {
  await boot(page);
  await setClock(page, 22); // winter
  await setPile(page, 'grove', { berries: 6 });

  // Winter cap 5, margin 2 → bleeds 6→5→4→3→2 and settles at the winter floor (2), below the spring floor (4).
  expect((await spoil(page)).grove.berries).toBe(5);
  expect((await spoil(page)).grove.berries).toBe(4);
  expect((await spoil(page)).grove.berries).toBe(3);
  expect((await spoil(page)).grove.berries).toBe(2);
  expect((await spoil(page)).grove.berries).toBe(2); // holds at the deeper winter floor
  expect((await events(page)).some((e) => e.includes('🥀') && e.includes('spoiled'))).toBe(true);
});

test('summer eases spoilage: a pile one below the base cap is never touched', async ({ page }) => {
  await boot(page);
  await setClock(page, 8); // summer — cap 7, margin 0 (only the very cap spoils)
  await setPile(page, 'bowl', { berries: 6 });
  await spoil(page);
  expect((await foodPile(page, 'bowl')).berries).toBe(6);
});
