import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Reputation cows the bully (BACKLOG-397). The slink spec's staging, run twice over the production
 * `checkFeeding` path: at the first drop a bold winner stands and the gobbler slinks off; at the second the
 * same gobbler waits its turn instead (⏳), and the winner eats without a contest.
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

const names = (p: Page) => p.evaluate(() => (window as W).__dinoPositions().map((d: any) => d.name) as string[]);
const hunger = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__needs() as Record<string, { hunger: number }>)[nn]?.hunger ?? 0, n);

async function drop(page: Page, winner: string, gobbler: string, winnerBravery: number) {
  await page.evaluate(
    ({ winner, gobbler, DROP_COL, DROP_ROW, winnerBravery }) => {
      const w = window as W;
      for (const d of w.__dinoPositions()) w.__setNeed(d.name, 'hunger', 0); // nobody else pushes in
      w.__placeDino(winner, DROP_COL, DROP_ROW);
      w.__placeDino(gobbler, DROP_COL + 3, DROP_ROW);
      w.__setNeed(winner, 'hunger', 0.45);
      w.__setNeed(gobbler, 'hunger', 0.95);
      w.__setTrait(winner, 'agreeableness', 0.9);
      w.__setTrait(winner, 'bravery', winnerBravery);
      w.__setTrait(gobbler, 'agreeableness', 0.1);
      w.__dropFood(DROP_COL);
      w.__stepWorld();
    },
    { winner, gobbler, DROP_COL, DROP_ROW, winnerBravery },
  );
}

test('a bully stood up to once waits its turn behind that dino the next time', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'strangers'); // no feud squaring the pair off between drops
  const [winner, gobbler] = await names(page);

  await drop(page, winner, gobbler, 0.9);
  expect(await page.evaluate(() => (window as W).__standFood())).toEqual({ winner, gobbler });
  expect(await page.evaluate(() => (window as W).__lastWait())).toBeNull();

  await drop(page, winner, gobbler, 0.9);
  expect(await page.evaluate(() => (window as W).__lastWait())).toEqual({ bully: gobbler, winner });
  expect(await page.evaluate(() => (window as W).__standFood())).toBeNull();
  expect(await page.evaluate(() => (window as W).__gobbleFood())).toBeNull();
  expect(await hunger(page, winner)).toBeLessThan(0.1); // staged at 0.45 — it ate, uncontested
  expect(await hunger(page, gobbler)).toBeGreaterThanOrEqual(0.9); // and the bully went without
  const log = await page.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
  expect(log).toContain(`⏳ ${gobbler} waited its turn behind ${winner}`);
  expect(errors).toEqual([]);
});

test('a gobbler with no history still shoulders a timid winner', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);
  await foundingState(page, 'strangers');
  const [winner, gobbler] = await names(page);

  await drop(page, winner, gobbler, 0.1);
  expect(await page.evaluate(() => (window as W).__gobbleFood())).toEqual({ winner, gobbler });
  expect(await page.evaluate(() => (window as W).__lastWait())).toBeNull();
  expect(errors).toEqual([]);
});
