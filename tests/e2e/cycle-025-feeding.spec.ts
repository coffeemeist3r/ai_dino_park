import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;

test('dropped food gets swarmed and eaten, feeding a dino', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await boot(page);

  const result = await page.evaluate(() => {
    const w = window as W;
    const positions = (w.__dinoPositions as () => Array<{ name: string; x: number; y: number }>)();
    // drop the food in the column of the first dino so the cast has someone in range
    const col = Math.round((positions[0].x - 16) / 32);
    const landing = (w.__dropFood as (c?: number) => { tileX: number; tileY: number } | null)(col);
    const pending = (w.__food as () => unknown)();

    // advance the world until the food is gone (eaten) or we run out of patience
    let steps = 0;
    while ((w.__food as () => unknown)() !== null && steps < 15) {
      (w.__stepWorld as () => unknown)();
      steps++;
    }

    const memory = (w.__memory as () => Record<string, string[]>)();
    const hearts = (w.__hearts as () => Record<string, number>)();
    const fedSomeone = Object.values(memory).some((lines) =>
      lines.some((m) => m.includes('snapped up the food') || m.includes('scrambled to the hatch')),
    );
    const events = (w.__events as () => string[])();
    return {
      landing,
      hadPending: pending !== null,
      eaten: (w.__food as () => unknown)() === null,
      fedSomeone,
      maxHearts: Math.max(0, ...Object.values(hearts)),
      droppedLogged: events.some((e) => e.includes('food dropped')),
      ateLogged: events.some((e) => e.includes('snapped up the food')),
    };
  });

  expect(result.landing).not.toBeNull();
  expect(result.hadPending).toBe(true); // food existed right after the drop
  expect(result.eaten).toBe(true); // the swarm consumed it
  expect(result.fedSomeone).toBe(true); // a dino remembers the feed (so it can gossip)
  expect(result.droppedLogged).toBe(true); // the drop posted to Park News
  expect(result.ateLogged).toBe(true); // the eat posted to Park News
  expect(errors).toEqual([]);
});

test('only one piece of food is in play at a time', async ({ page }) => {
  await boot(page);

  const result = await page.evaluate(() => {
    const w = window as W;
    const first = (w.__dropFood as (c?: number) => { tileX: number; tileY: number })(0);
    // a second drop while food is still in play is ignored — returns the same tile
    const second = (w.__dropFood as (c?: number) => { tileX: number; tileY: number })(19);
    return { first, second };
  });

  // the second drop did not relocate the food to column 19 — it was ignored
  expect(result.second).toEqual(result.first);
  expect(result.first.tileX).toBe(0);
});
