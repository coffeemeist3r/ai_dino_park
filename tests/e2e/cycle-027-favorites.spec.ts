import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;

/** Drop a specific food in the first dino's lane, step until it's eaten, and report
 *  who ate, whether they recorded a "favorite" memory, and their favorite food id. */
async function feedAndInspect(page: import('@playwright/test').Page, foodId: string) {
  return page.evaluate((fid) => {
    const w = window as W;
    const positions = (w.__dinoPositions as () => Array<{ name: string; x: number; y: number }>)();
    const col = Math.round((positions[0].x - 16) / 32);
    (w.__dropFood as (c?: number, f?: string) => unknown)(col, fid);

    let steps = 0;
    while ((w.__food as () => unknown)() !== null && steps < 15) {
      (w.__stepWorld as () => unknown)();
      steps++;
    }

    const memory = (w.__memory as () => Record<string, string[]>)();
    const hearts = (w.__hearts as () => Record<string, number>)();
    const eater =
      Object.keys(memory).find((name) =>
        memory[name].some((m) => m.includes('snapped up the food') || m.includes('scrambled to the hatch')),
      ) ?? null;
    const eaterFav = eater
      ? (w.__favoriteFood as (n: string) => { id: string } | null)(eater)?.id ?? null
      : null;
    const eaterMemHasFavorite = eater ? memory[eater].some((m) => m.includes('favorite')) : false;
    const events = (w.__events as () => string[])();
    return {
      eaten: (w.__food as () => unknown)() === null,
      eater,
      eaterFav,
      eaterMemHasFavorite,
      eaterHearts: eater ? hearts[eater] ?? 0 : 0,
      droppedLogged: events.some((e) => e.includes('food dropped')),
      ateLogged: events.some((e) => e.includes('snapped up the food')),
    };
  }, foodId);
}

test('a dino that grabs its favorite food is extra-happy and remembers it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);

  // Drop the first dino's own favorite into its lane.
  const fav = await page.evaluate(() => {
    const w = window as W;
    const positions = (w.__dinoPositions as () => Array<{ name: string }>)();
    return (w.__favoriteFood as (n: string) => { id: string })(positions[0].name);
  });

  const r = await feedAndInspect(page, fav.id);

  expect(r.eaten).toBe(true);
  expect(r.eater).not.toBeNull();
  // Whoever ate it: the "favorite" memory is written exactly when the food WAS their favorite.
  expect(r.eaterMemHasFavorite).toBe(r.eaterFav === fav.id);
  if (r.eaterMemHasFavorite) expect(r.eaterHearts).toBeGreaterThan(0);
  expect(r.droppedLogged).toBe(true);
  expect(r.ateLogged).toBe(true);
  expect(errors).toEqual([]);
});

test('a food no founder favors is eaten as plain feed (no favorite memory)', async ({ page }) => {
  await boot(page);

  // 'fish' fits none of the five founders' temperaments, so the eater records plain feed.
  const r = await feedAndInspect(page, 'fish');

  expect(r.eaten).toBe(true);
  expect(r.eater).not.toBeNull();
  expect(r.eaterFav).not.toBe('fish'); // sanity: nobody at boot favors fish
  expect(r.eaterMemHasFavorite).toBe(false); // plain feed, no "favorite" line
  expect(r.droppedLogged).toBe(true);
  expect(r.ateLogged).toBe(true);
});
