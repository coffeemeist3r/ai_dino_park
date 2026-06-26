import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Jealousy = { name: string; line: string; memory: string } | null;
type Homecoming = { name: string; hearts: number; line: string; memory: string; jealous: Jealousy } | null;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[]; homecoming: Homecoming };

const DAY_MS = 24 * 60 * 60_000; // one in-game day of real time at 1×

async function stageJealousy(page: import('@playwright/test').Page) {
  await boot(page);
  // Two single greets land within one heart's worth => a guaranteed near-tie.
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    greet('Sunny');
    greet('Glade');
  });
  return page.evaluate((ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms), 2 * DAY_MS);
}

test('greeting the jealous runner-up repairs it with an outsized bump and a 😊 (BACKLOG-125)', async ({ page }) => {
  const result = await stageJealousy(page);
  expect(result.homecoming?.jealous).not.toBeNull();
  const sulker = result.homecoming!.jealous!.name;

  // it's queued for repair
  const pending = await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)());
  expect(pending).toBe(sulker);

  const points = () =>
    page.evaluate(() => ((window as W).__friendshipPoints as () => Record<string, number>)());

  // Lift the sulker out of loner status (BACKLOG-135) so the second, ordinary greet isn't padded by the
  // loner bonus — this test measures the repair bonus differential in isolation.
  await page.evaluate((n) => {
    const partner = n === 'Rex' ? 'Mossback' : 'Rex';
    ((window as W).__bondPair as (a: string, b: string, amt: number) => void)(n, partner, 30);
  }, sulker);

  // make-up greet: outsized
  const before = (await points())[sulker];
  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), sulker);
  const afterRepair = (await points())[sulker];
  const repairDelta = afterRepair - before;

  // pending cleared, 😊 bubble rendered
  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBeNull();
  const bubbles = await page.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
  expect(bubbles.some((t) => t.includes('😊') && t.includes(sulker))).toBe(true);

  // second greet is now an ordinary greet (one-shot): smaller delta, by exactly the bonus
  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), sulker);
  const afterNormal = (await points())[sulker];
  const normalDelta = afterNormal - afterRepair;
  expect(repairDelta).toBeGreaterThan(normalDelta);
  expect(repairDelta - normalDelta).toBe(6); // REPAIR_BONUS
});

test('greeting the slighted dino files a distinct "noticed" memory (BACKLOG-125)', async ({ page }) => {
  const result = await stageJealousy(page);
  const sulker = result.homecoming!.jealous!.name;

  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), sulker);
  const mem = await page.evaluate(
    (n) => (((window as W).__memory as () => Record<string, string[]>)()[n] ?? []),
    sulker,
  );
  expect(mem.some((e) => e.includes('noticed') && e.includes(sulker))).toBe(true);
});

test('greeting a non-jealous dino leaves the pending repair untouched (BACKLOG-125)', async ({ page }) => {
  const result = await stageJealousy(page);
  const sulker = result.homecoming!.jealous!.name;
  const homecomer = result.homecoming!.name;

  // greet the homecomer (not the sulker) — must not consume the repair
  await page.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), homecomer);
  expect(await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)())).toBe(sulker);
});
