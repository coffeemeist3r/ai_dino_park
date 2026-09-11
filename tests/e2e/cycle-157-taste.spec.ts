import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, unknown>;

/**
 * BACKLOG-066 — taste talk. The park has computed a favorite food for every dino since cycle 25; until
 * this cycle the only way a player could learn one was to catch a 😋 in the single frame it renders.
 *
 * These specs drive the canned line, not the model: `__greetLine` is the deterministic half that ships to
 * every device whether or not a brain ever loads, which is the half the reachability bar is about.
 */

const cannedLine = (page: Page, name: string): Promise<string> =>
  page.evaluate((n) => ((window as W).__greetLine as (x: string) => string)(n), name);

/** The named dino's current favorite, by label — the same read the hatch and the scan panel use. */
const favoriteLabel = (page: Page, name: string): Promise<string> =>
  page.evaluate((n) => ((window as W).__favoriteFood as (x: string) => { label: string })(n).label, name);

test('a dino that just ate its favorite lets it slip when you talk to it (BACKLOG-066)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const label = await favoriteLabel(page, 'Sunny');
  const foodId: string = await page.evaluate(
    (n) => ((window as W).__favoriteFood as (x: string) => { id: string })(n).id,
    'Sunny',
  );

  // Before the meal it has nothing to say about food.
  expect(await cannedLine(page, 'Sunny')).not.toContain(label);

  await page.evaluate((f) => ((window as W).__dropFood as (c?: number, id?: string) => unknown)(undefined, f), foodId);
  await page.evaluate(() => ((window as W).__eat as (n: string) => void)('Sunny'));

  // After it, the food is in its mouth — named, because naming it is what loving it sounds like.
  expect(await cannedLine(page, 'Sunny')).toContain(label);
});

test('a dino that ate something else does not recite the menu (BACKLOG-066)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  const favorite: string = await page.evaluate(
    (n) => ((window as W).__favoriteFood as (x: string) => { id: string })(n).id,
    'Sunny',
  );
  const other = ['fish', 'meat', 'greens', 'berries'].find((f) => f !== favorite)!;

  await page.evaluate((f) => ((window as W).__dropFood as (c?: number, id?: string) => unknown)(undefined, f), other);
  await page.evaluate(() => ((window as W).__eat as (n: string) => void)('Sunny'));

  const line = await cannedLine(page, 'Sunny');
  // It mentions the hatch — a meal happened — but it never says "my favorite", because it wasn't. A park
  // where every dino recites its dinner is a menu board, not five opinions.
  expect(line).toContain('hatch');
  expect(line).not.toContain('favorite');
});

test('a dino that has not eaten says nothing about the hatch (BACKLOG-066)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const label = await favoriteLabel(page, 'Glade');
  expect(await cannedLine(page, 'Glade')).not.toContain(label);
});
