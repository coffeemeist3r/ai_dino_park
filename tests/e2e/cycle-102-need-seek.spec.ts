import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Need pulls the body (BACKLOG-436). A pressing need leans a dino's wander toward relief: hunger toward the
 * hatch feeding zone, thirst toward the grove pond (grove-only — the one place thirst is slaked). __needStep
 * applies one forced seek step so the body can be watched pulled toward the target deterministically.
 */

type W = Record<string, any>;
type Tile = { tileX: number; tileY: number };

const setNeed = (p: Page, name: string, which: string, v: number) =>
  p.evaluate(({ name, which, v }) => (window as W).__setNeed(name, which, v), { name, which, v });
const needTarget = (p: Page, name: string) =>
  p.evaluate((name) => (window as W).__needTarget(name) as Tile | null, name);
const needStep = (p: Page, name: string) =>
  p.evaluate((name) => (window as W).__needStep(name) as Tile, name);
const migrate = (p: Page, name: string, zone: string) =>
  p.evaluate(({ name, zone }) => (window as W).__migrate(name, zone), { name, zone });

const cheb = (a: Tile, b: Tile) => Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY));

test('pressing hunger targets the hatch and pulls the body toward it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await setNeed(page, 'Rex', 'hunger', 1);
  const target = await needTarget(page, 'Rex');
  expect(target).not.toBeNull();

  // forced seek steps close the gap to 0 (the body is pulled to the hatch)
  let reached = false;
  let last = await needStep(page, 'Rex');
  for (let i = 0; i < 60 && !reached; i++) {
    const t = await needStep(page, 'Rex');
    if (cheb(t, target!) === 0) reached = true;
    last = t;
  }
  expect(reached, `ended at ${JSON.stringify(last)}, target ${JSON.stringify(target)}`).toBe(true);
  expect(errors).toEqual([]);
});

/**
 * BACKLOG-445 inverted this test. It used to pin "thirst pulls only in the grove", which was the
 * shipped truth *and* the bug: the grove was the one place with water, so this feature — the need
 * pulling the body — was a no-op for thirst in two zones out of three. Every zone has its own water
 * now, so the pull works everywhere; what's still worth pinning is that the target follows the dino.
 */
test('thirst pulls toward the water of whichever zone the dino is in (BACKLOG-445)', async ({ page }) => {
  await boot(page);

  await setNeed(page, 'Rex', 'thirst', 1);
  const inBowl = await needTarget(page, 'Rex');
  expect(inBowl).not.toBeNull(); // was null before 445 — the no-op this closed

  await migrate(page, 'Rex', 'grove');
  await setNeed(page, 'Rex', 'thirst', 1);
  const inGrove = await needTarget(page, 'Rex');
  expect(inGrove).not.toBeNull();
  expect(inGrove).not.toEqual(inBowl); // it walks to its *own* zone's water, not a fixed pond
});

test('a sated dino has no seek target', async ({ page }) => {
  await boot(page);
  expect(await needTarget(page, 'Rex')).toBeNull();
});
