import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The waterhole (BACKLOG-445) — Milestone 5 structure arc 3. Thirst has existed since cycle 80 with
 * exactly one place in the whole park to resolve it: the grove's NE pond. That quietly made the
 * need-pull (436) a no-op for thirst in two zones out of three. Every zone answers for itself now —
 * the bowl gets a waterhole, the Fernreach's creek (drawn since 399) finally gets drunk from.
 *
 * Driven via __placeDino / __setNeed / __checkNeeds / __setZone, asserted on __needs + __needTarget.
 */

type W = Record<string, any>;

const thirst = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__needs() as Record<string, { thirst: number }>)[n]?.thirst ?? 0, name);
const setThirst = (p: Page, name: string, v: number) =>
  p.evaluate(({ name, v }) => (window as W).__setNeed(name, 'thirst', v), { name, v });
const place = (p: Page, name: string, x: number, y: number) =>
  p.evaluate(({ name, x, y }) => (window as W).__placeDino(name, x, y), { name, x, y });
const checkNeeds = (p: Page) => p.evaluate(() => (window as W).__checkNeeds());
const needTarget = (p: Page, name: string) => p.evaluate((n) => (window as W).__needTarget(n), name);

test('a thirsty dino drinks at the bowl waterhole (BACKLOG-445)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await place(page, 'Rex', 3, 2); // the NW waterhole block
  await setThirst(page, 'Rex', 0.8);
  await checkNeeds(page);

  expect(await thirst(page, 'Rex')).toBe(0);
  expect(errors).toEqual([]);
});

test('dry ground in the bowl does not slake thirst (BACKLOG-445)', async ({ page }) => {
  await boot(page);

  await place(page, 'Rex', 10, 10); // open grass, nowhere near the waterhole
  await setThirst(page, 'Rex', 0.8);
  await checkNeeds(page);

  expect(await thirst(page, 'Rex')).toBeGreaterThan(0.8); // it climbed; it was not reset
});

test("the Fernreach's creek finally gets drunk from (BACKLOG-445)", async ({ page }) => {
  await boot(page);

  // move a bowl resident into the third zone, then stand it in the creek that has been drawn since 399
  expect(await page.evaluate(() => (window as W).__migrate('Rex', 'fernreach'))).toBe('fernreach');
  await page.evaluate(() => (window as W).__setZone('fernreach'));
  await place(page, 'Rex', 3, 7); // the west creek run
  await setThirst(page, 'Rex', 0.8);
  await checkNeeds(page);

  expect(await thirst(page, 'Rex')).toBe(0);
});

test('thirst resolves against the zone the dino is in, not the one it left (BACKLOG-445)', async ({
  page,
}) => {
  await boot(page);

  // the bowl's waterhole coordinates are dry ground in the Fernreach — the check must follow the dino
  await page.evaluate(() => (window as W).__migrate('Rex', 'fernreach'));
  await page.evaluate(() => (window as W).__setZone('fernreach'));
  await place(page, 'Rex', 12, 6); // open ground in the Fernreach — east of the creek, north of the scrub
  await setThirst(page, 'Rex', 0.8);
  await checkNeeds(page);

  expect(await thirst(page, 'Rex')).toBeGreaterThan(0.8);
});

test('a thirsty dino has somewhere to walk to in every zone (BACKLOG-445 — the 436 no-op)', async ({
  page,
}) => {
  await boot(page);

  // hunger below the threshold so thirst is unambiguously the pressing need
  await page.evaluate(() => (window as W).__setNeed('Rex', 'hunger', 0));
  await place(page, 'Rex', 10, 10);
  await setThirst(page, 'Rex', 0.8);

  const target = await needTarget(page, 'Rex');
  expect(target).not.toBeNull(); // before 445 this was null everywhere but the grove
  expect(target).toEqual({ tileX: 3, tileY: 2 }); // the bowl's own waterhole, not the grove's pond
});

test('the bowl floor still renders with a terrain layout (BACKLOG-445)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__groundReady())).toBe(true);
  expect(errors).toEqual([]);
});

test('the bowl waterhole is not the grove pond — no pond-sight beat (BACKLOG-445 guard)', async ({
  page,
}) => {
  await boot(page);

  await place(page, 'Rex', 3, 2);
  await checkNeeds(page);
  await page.evaluate(() => (window as W).__stepWorld());

  // 359's once-ever beat is grove lore; standing in the bowl's water must never fire it
  expect(await page.evaluate(() => (window as W).__pondSeen() as string[])).not.toContain('Rex');
});
