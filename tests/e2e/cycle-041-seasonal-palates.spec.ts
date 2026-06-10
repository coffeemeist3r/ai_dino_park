import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;

// Days that land squarely inside each season (7-day seasons, 1-indexed, 28-day year):
// spring 1–7, summer 8–14, fall 15–21, winter 22–28.
const SEASON_DAY = { spring: 4, summer: 11, fall: 18, winter: 25 } as const;

function favId(page: import('@playwright/test').Page, name: string): Promise<string | null> {
  return page.evaluate((n) => {
    const fav = (window as W).__favoriteFood as (x: string) => { id: string } | null;
    return fav(n)?.id ?? null;
  }, name);
}

/** Park the clock on a day inside `season` (restore-semantics: repaints, fires no turn beat). */
async function setSeason(page: import('@playwright/test').Page, season: keyof typeof SEASON_DAY) {
  await page.evaluate((d) => {
    (window as W).__setClock && ((window as W).__setClock as (a: number, b: number, c: number) => unknown)(d, 12, 0);
  }, SEASON_DAY[season]);
}

test('a dino on the fence begs differently in winter than in summer', async ({ page }) => {
  await boot(page);

  await setSeason(page, 'winter');
  const rexWinter = await favId(page, 'Rex');
  await setSeason(page, 'summer');
  const rexSummer = await favId(page, 'Rex');

  expect(rexWinter).toBe('meat'); // winter prizes meat
  expect(rexSummer).toBe('berries'); // summer sweetens to berries
  expect(rexWinter).not.toBe(rexSummer); // the same dino, two cravings
});

test('a strong-fit dino stays loyal to its food all year', async ({ page }) => {
  await boot(page);
  for (const season of ['spring', 'summer', 'fall', 'winter'] as const) {
    await setSeason(page, season);
    expect(await favId(page, 'Twitch')).toBe('greens'); // Twitch the herbivore never sways
  }
});

test('the seasonal craving table is live to the bowl', async ({ page }) => {
  await boot(page);
  const craving = await page.evaluate(() => {
    const c = (window as W).__seasonCraving as (s: string) => string;
    return { spring: c('spring'), summer: c('summer'), fall: c('fall'), winter: c('winter') };
  });
  expect(craving).toEqual({ spring: 'greens', summer: 'berries', fall: 'fish', winter: 'meat' });
});

test('the bowl eats by the live season: meat delights a meat-craver in winter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);
  await setSeason(page, 'winter');

  const r = await page.evaluate(() => {
    const w = window as W;
    const positions = (w.__dinoPositions as () => Array<{ name: string; x: number; y: number }>)();
    const rex = positions.find((p) => p.name === 'Rex')!;
    const col = Math.round((rex.x - 16) / 32);
    (w.__dropFood as (c?: number, f?: string) => unknown)(col, 'meat');

    let steps = 0;
    while ((w.__food as () => unknown)() !== null && steps < 15) {
      (w.__stepWorld as () => unknown)();
      steps++;
    }

    const memory = (w.__memory as () => Record<string, string[]>)();
    const eater =
      Object.keys(memory).find((name) =>
        memory[name].some((m) => m.includes('snapped up the food') || m.includes('scrambled to the hatch')),
      ) ?? null;
    const eaterFav = eater
      ? (w.__favoriteFood as (n: string) => { id: string } | null)(eater)?.id ?? null
      : null;
    const eaterMemHasFavorite = eater ? memory[eater].some((m) => m.includes('favorite')) : false;
    return {
      eaten: (w.__food as () => unknown)() === null,
      eater,
      eaterFav,
      eaterMemHasFavorite,
    };
  });

  expect(r.eaten).toBe(true);
  expect(r.eater).not.toBeNull();
  // The eat path reads the live (winter) season: the "favorite" memory fires exactly when the
  // eaten food is the eater's WINTER favorite. Dropped in Rex's lane, the eater craves meat in
  // winter, so the delight is real — and the invariant holds whoever reaches the food first.
  expect(r.eaterMemHasFavorite).toBe(r.eaterFav === 'meat');
  expect(r.eaterFav).toBe('meat'); // a meat-craver ate it (Rex/Mossback/Glade all crave meat in winter)
  expect(errors).toEqual([]);
});
