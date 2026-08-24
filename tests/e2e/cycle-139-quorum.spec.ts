import { test, expect, type Page } from '@playwright/test';
import { boot, emptyGrounds } from './helpers';

/**
 * The council nobody can convene (BACKLOG-497) — the reachability half, in the running game.
 *
 * `cycle-139-quorum.test.ts` pins the founding seating as pure data. This asserts the park actually boots
 * into it: the ground the player spawns on seats two voices before they have walked anywhere or pressed
 * anything, which is the state every governance beat built since 487 has been waiting for.
 */

type W = Record<string, any>;

const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);

test('the ground the player spawns on seats a council that can disagree, from the first frame', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const seats = await councils(page);
  expect(seats.bowl.length).toBeGreaterThanOrEqual(2);
  // ...and the Grove keeps the single seat 492 gave it, so this added a ground rather than moving one.
  expect(seats.grove.length).toBeGreaterThanOrEqual(1);

  // The ground the player spawns on has a decided policy the moment the game opens.
  expect(await page.evaluate(() => (window as W).__spendPriority('bowl'))).not.toBeNull();

  expect(errors).toEqual([]);
});

test('the pre-governance fixture is still reachable by name — the control', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await emptyGrounds(page);

  const seats = await councils(page);
  expect(seats.bowl).toEqual([]);
  expect(seats.grove).toEqual([]);

  expect(errors).toEqual([]);
});
