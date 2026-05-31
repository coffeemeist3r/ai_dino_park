import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

test('a clutch hatches into a new blended dino', async ({ page }) => {
  await boot(page);

  const pop0 = await page.evaluate(() => ((window as W).__population as () => number)());

  // Force a clutch from Rex + Mossback (sets a high bond, then lays).
  const laid = await page.evaluate(() => {
    const egg = ((window as W).__layEgg as (a: string, b: string) => unknown)('Rex', 'Mossback');
    return { egg, eggs: ((window as W).__eggs as () => unknown[])().length };
  });
  expect(laid.egg).not.toBeNull();
  expect(laid.eggs).toBe(1);

  // Hatch it deterministically (the incubation-day gate is unit-tested via isHatched).
  const after = await page.evaluate(() => {
    ((window as W).__forceHatch as () => number)();
    return {
      pop: ((window as W).__population as () => number)(),
      eggs: ((window as W).__eggs as () => unknown[])().length,
      names: ((window as W).__dinoNames as () => string[])(),
    };
  });

  expect(after.pop).toBe(pop0 + 1);
  expect(after.eggs).toBe(0);
  expect(after.names.some((n) => n.startsWith('Rex'))).toBe(true);
});

test('the park breeds itself up over a long night but never exceeds the population cap', async ({ page }) => {
  await boot(page);

  // Bond up several pairs, then run many night steps — emergent breeding should fill in
  // new dinos but the MAX_POPULATION cap must hold.
  const pop = await page.evaluate(() => {
    const layEgg = (window as W).__layEgg as (a: string, b: string) => unknown;
    layEgg('Rex', 'Mossback');
    layEgg('Sunny', 'Glade');
    ((window as W).__advanceMinutes as (n: number) => unknown)(60 * 24 * 5);
    const step = (window as W).__stepWorld as () => unknown;
    for (let i = 0; i < 60; i++) step();
    return ((window as W).__population as () => number)();
  });

  expect(pop).toBeGreaterThan(5); // it grew
  expect(pop).toBeLessThanOrEqual(12); // MAX_POPULATION held
});

test('a born dino survives a reload', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => {
    ((window as W).__layEgg as (a: string, b: string) => unknown)('Sunny', 'Glade');
    ((window as W).__forceHatch as () => number)();
  });
  const popBefore = await page.evaluate(() => ((window as W).__population as () => number)());
  await page.evaluate(() => ((window as W).__saveNow as () => Promise<unknown>)());

  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });

  await page.waitForFunction(
    (target) => {
      const f = (window as W).__population as undefined | (() => number);
      return !!f && f() >= target;
    },
    popBefore,
    { timeout: 8_000 },
  );
});
