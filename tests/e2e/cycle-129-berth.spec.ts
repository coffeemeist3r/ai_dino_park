import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The berth (BACKLOG-389). 401 gave a dino a per-opponent history and spent it at the last instant of an
 * encounter — two dinos already over the drop, who holds and who cedes. Here the same history decides
 * something *earlier*: whether the dino walks over there at all.
 *
 * The memory strings are built by the production builder (`slunkOffMemory`'s shape) rather than re-typed,
 * per the cycle-127 finding, and the assertion is on movement, not only on the hook: the wary dino must
 * still be where it was while the rival closes on the food.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const posOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__dinoPositions() as { name: string; x: number; y: number }[]).find((d) => d.name === n)!, name);
const remember = (p: Page, name: string, event: string) =>
  p.evaluate(([n, e]) => (window as W).__remember(n, e), [name, event]);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

test('a dino keeps clear of the rival that has out-grabbed it here before', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [shy, bully] = await roster(page);

  // Two lost contests with this one dino — the strings the game itself files (394).
  await remember(page, shy, `${bully} wouldn't budge — you slunk off`);
  await remember(page, shy, `${bully} wouldn't budge — you slunk off`);
  expect(await page.evaluate(([a, b]) => (window as W).__disposition(a, b), [shy, bully])).toBe('wary');

  // Stand both in the drop column, the bully nearer the food than the shy one. Both are eager enough to
  // rush (the berth must be what keeps it back, not distance or listlessness).
  await page.evaluate(([a, b]) => {
    (window as W).__setTrait(a, 'energy', 0.9);
    (window as W).__setTrait(b, 'energy', 0.9);
  }, [shy, bully]);
  const food = await page.evaluate(() => (window as W).__dropFood(5));
  await page.evaluate(
    ([a, b, fx, fy]) => {
      (window as W).__placeDino(a, fx as number, (fy as number) + 4);
      (window as W).__placeDino(b, fx as number, (fy as number) + 2);
    },
    [shy, bully, food.tileX, food.tileY],
  );
  const foodPx = await page.evaluate(() => {
    const f = (window as W).__food();
    const TILE = 32; // WorldScene's tile size — the only constant a spec needs to read pixel space
    return { x: f.tileX * TILE + TILE / 2, y: f.tileY * TILE + TILE / 2 };
  });

  const toFood = (d: { x: number; y: number }) => Math.hypot(d.x - foodPx.x, d.y - foodPx.y);
  const shyBefore = toFood(await posOf(page, shy));
  const bullyBefore = toFood(await posOf(page, bully));
  await step(page);

  expect(await page.evaluate(() => (window as W).__berth())).toEqual({ name: shy, rival: bully });
  // The bully closed on the food; the shy one did not (it wanders, tics, does anything but join the swarm).
  expect(toFood(await posOf(page, bully))).toBeLessThan(bullyBefore);
  expect(toFood(await posOf(page, shy))).toBeGreaterThanOrEqual(shyBefore - 0.001);

  const line = `😬 ${shy} hung back — ${bully} got to the food first`;
  expect(await ticker(page)).toContain(line);

  // A hesitation, not a chant: standing there another step doesn't repeat it.
  await step(page);
  const log = await ticker(page);
  expect(log.split(line).length - 1).toBe(1);

  expect(errors).toEqual([]);
});

test('a dino with no history at the hatch still comes to dinner', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [a, b] = await roster(page);
  expect(await page.evaluate(([x, y]) => (window as W).__disposition(x, y), [a, b])).toBeNull();

  await page.evaluate(([x, y]) => {
    (window as W).__setTrait(x, 'energy', 0.9);
    (window as W).__setTrait(y, 'energy', 0.9);
  }, [a, b]);
  const food = await page.evaluate(() => (window as W).__dropFood(5));
  await page.evaluate(
    ([x, y, fx, fy]) => {
      (window as W).__placeDino(x, fx as number, (fy as number) + 4);
      (window as W).__placeDino(y, fx as number, (fy as number) + 2);
    },
    [a, b, food.tileX, food.tileY],
  );
  const foodPx = await page.evaluate(() => {
    const f = (window as W).__food();
    const TILE = 32; // WorldScene's tile size — the only constant a spec needs to read pixel space
    return { x: f.tileX * TILE + TILE / 2, y: f.tileY * TILE + TILE / 2 };
  });

  const toFood = (d: { x: number; y: number }) => Math.hypot(d.x - foodPx.x, d.y - foodPx.y);
  const before = toFood(await posOf(page, a));
  await step(page);
  expect(await page.evaluate(() => (window as W).__berth())).toBeNull();
  expect(toFood(await posOf(page, a))).toBeLessThan(before); // it rushed, as it always did
  expect(errors).toEqual([]);
});
