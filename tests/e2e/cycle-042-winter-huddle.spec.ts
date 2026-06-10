import { test, expect } from '@playwright/test';

import { boot } from './helpers';

type W = Record<string, unknown>;

/** Stage a bond, set the clock (restore-semantics — no turn beat), and read the huddle verdict. */
async function stage(
  page: import('@playwright/test').Page,
  pair: [string, string],
  amount: number | undefined,
  clock: [number, number, number],
) {
  await page.evaluate(
    ({ pair: [a, b], amount, clock: [day, hour, minute] }) => {
      const w = window as W;
      (w.__bondPair as (a: string, b: string, amt?: number) => number)(a, b, amount);
      (w.__setClock as (d: number, h: number, m: number) => void)(day, hour, minute);
    },
    { pair, amount, clock },
  );
  return page.evaluate(() =>
    ((window as W).__huddleInfo as () => { season: string; threshold: number; inWindow: boolean })(),
  );
}

async function stepAndHuddlers(page: import('@playwright/test').Page, steps: number): Promise<string[]> {
  return page.evaluate((n) => {
    const w = window as W;
    const step = w.__stepWorld as () => unknown;
    const who = w.__huddlers as () => string[];
    for (let i = 0; i < n; i++) step();
    return who();
  }, steps);
}

test('winter dusk pulls bonded dinos to the den at 19:30 — an hour no other season huddles', async ({ page }) => {
  await boot(page);

  const info = await stage(page, ['Rex', 'Mossback'], undefined, [22, 19, 30]);
  expect(info.season).toBe('winter');
  expect(info.threshold).toBe(4);
  expect(info.inWindow).toBe(true);

  const huddlers = await stepAndHuddlers(page, 45);
  expect(huddlers).toContain('Rex');
  expect(huddlers).toContain('Mossback');
});

test('winter admits a loosely-bonded pair the old threshold would leave out', async ({ page }) => {
  await boot(page);

  // Bond of exactly 4: below the legacy bar (8), at winter's lowered bar.
  const info = await stage(page, ['Sunny', 'Glade'], 4, [22, 22, 0]);
  expect(info).toEqual({ season: 'winter', threshold: 4, inWindow: true });

  const huddlers = await stepAndHuddlers(page, 45);
  expect(huddlers).toContain('Sunny');
  expect(huddlers).toContain('Glade');
});

test('a summer night at 21:30 stays scattered — the window has not opened', async ({ page }) => {
  await boot(page);

  const info = await stage(page, ['Rex', 'Mossback'], undefined, [10, 21, 30]);
  expect(info.season).toBe('summer');
  expect(info.inWindow).toBe(false);

  // isHuddling requires the window, so the verdict is structural — no dino can register
  // as huddling at 21:30 in summer no matter where it wandered.
  const huddlers = await stepAndHuddlers(page, 10);
  expect(huddlers).toEqual([]);
});

test('spring nights behave exactly as before the seasons reached the den', async ({ page }) => {
  await boot(page);

  const info = await stage(page, ['Rex', 'Mossback'], undefined, [3, 22, 0]);
  expect(info).toEqual({ season: 'spring', threshold: 8, inWindow: true });

  const huddlers = await stepAndHuddlers(page, 45);
  expect(huddlers).toContain('Rex');
  expect(huddlers).toContain('Mossback');
});
