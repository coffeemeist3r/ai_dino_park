import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Two who go together (BACKLOG-360) — the first crossing in this park's life that moves two bodies.
 *
 * The pure half (the pair read, its determinism, the destination gate) is unit-covered in
 * `game/src/world/together.test.ts`. This proves the live seam: a real pond-swap pair, a real crossing,
 * and both dinos actually mid-migration afterwards — plus the control that says the beat is inert on a
 * park nobody has walked.
 */

type W = Record<string, any>;

const names = (p: Page) => p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const memory = (p: Page) => p.evaluate(() => (window as W).__memory() as Record<string, string[]>);
const bond = (p: Page, a: string, b: string) => p.evaluate(([x, y]) => (window as W).__bond(x, y) as number, [a, b]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);

/**
 * Make `a` and `b` a pond-swap pair back in the bowl. `groveVisited` fills on the *walked* crossing only
 * (339), so each must genuinely walk over; the instant hop back keeps the visit and puts them in one zone.
 */
async function pondPair(page: Page, a: string, b: string) {
  for (const n of [a, b]) {
    await page.evaluate((nn) => (window as W).__startMigrationTo(nn, 'grove'), n);
    for (let i = 0; i < 40 && (await migrating(page)).includes(n); i++) await step(page);
    await page.evaluate((nn) => (window as W).__migrate(nn, 'bowl'), n);
  }
  return page.evaluate(([x, y]) => (window as W).__pondSwap(x, y) as boolean, [a, b]);
}

test('a pond-swap pair crosses back to the grove together', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [a, b] = await names(page);
  expect(await pondPair(page, a, b)).toBe(true);

  const bondBefore = await bond(page, a, b);

  // `a` sets off for the grove by the ordinary crossing path; nothing here chooses a destination.
  await page.evaluate((n) => (window as W).__startMigrationTo(n, 'grove'), a);
  const companion = await page.evaluate((n) => (window as W).__together(n) as string | null, a);

  expect(companion).toBe(b);
  const onTheRoad = await migrating(page);
  expect(onTheRoad).toContain(a);
  expect(onTheRoad).toContain(b);

  // Both keep it, each naming the other and the ground.
  const mem = await memory(page);
  expect(mem[a].some((e) => e.includes(b) && e.includes('Grove'))).toBe(true);
  expect(mem[b].some((e) => e.includes(a) && e.includes('Grove'))).toBe(true);

  // The road earns a bond, and the ticker names both travellers.
  expect(await bond(page, a, b)).toBeGreaterThan(bondBefore);
  expect((await events(page)).some((e) => e.includes(a) && e.includes(b) && e.includes('Grove'))).toBe(true);

  expect(errors).toEqual([]);
});

test('the companion rides the destination — a crossing to any other ground carries nobody', async ({ page }) => {
  await boot(page);
  const [a, b] = await names(page);
  expect(await pondPair(page, a, b)).toBe(true);

  // The same pair, both back in the bowl, but this crossing is not bound for the place they bonded over.
  await page.evaluate((n) => (window as W).__startMigrationTo(n, 'fernreach'), a);
  expect(await page.evaluate((n) => (window as W).__together(n) as string | null, a)).toBeNull();
  expect(await migrating(page)).not.toContain(b);
});

test('inert on a park nobody has walked — no pair, no pull', async ({ page }) => {
  await boot(page);
  for (const n of await names(page)) {
    await page.evaluate((nn) => (window as W).__startMigrationTo(nn, 'grove'), n);
    expect(await page.evaluate((nn) => (window as W).__together(nn) as string | null, n)).toBeNull();
  }
});
