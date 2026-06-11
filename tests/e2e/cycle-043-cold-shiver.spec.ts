import { test, expect } from '@playwright/test';

import { boot } from './helpers';

type W = Record<string, unknown>;

/** Bond a pair past the den bar, set a night clock (restore-semantics, no turn beat). */
async function stageNight(
  page: import('@playwright/test').Page,
  pair: [string, string],
  clock: [number, number, number],
) {
  await page.evaluate(
    ({ pair: [a, b], clock: [day, hour, minute] }) => {
      const w = window as W;
      (w.__bondPair as (a: string, b: string, amt?: number) => number)(a, b, 12);
      (w.__setClock as (d: number, h: number, m: number) => void)(day, hour, minute);
    },
    { pair, clock },
  );
}

/** Step the world `n` times. */
async function step(page: import('@playwright/test').Page, n: number) {
  await page.evaluate((count) => {
    const w = window as W;
    const s = w.__stepWorld as () => unknown;
    for (let i = 0; i < count; i++) s();
  }, n);
}

/** Cross into morning past every window's close (hour 8) and step once to fire the edge. */
async function intoMorning(page: import('@playwright/test').Page, day: number) {
  await page.evaluate((d) => {
    const w = window as W;
    (w.__setClock as (dd: number, h: number, m: number) => void)(d, 8, 0);
    (w.__stepWorld as () => unknown)();
  }, day);
}

test('a dino too loosely bonded for the winter den shivers cold at morning', async ({ page }) => {
  await boot(page);

  // Rex & Mossback bond past the winter bar (welcome in the den); the rest stay at bond 0.
  await stageNight(page, ['Rex', 'Mossback'], [22, 20, 0]);
  await step(page, 2); // arm the in-window edge without letting the loners mingle into bonds
  await intoMorning(page, 22);

  const cold = await page.evaluate(() => ((window as W).__coldSleepers as () => string[])());
  expect(cold).not.toContain('Rex'); // bonded — welcome in the den, warm
  expect(cold).not.toContain('Mossback');
  expect(cold.length).toBeGreaterThan(0); // someone was left out in the cold
});

test('the cold night files a memory that colours the next greeting', async ({ page }) => {
  await boot(page);

  await stageNight(page, ['Rex', 'Mossback'], [22, 20, 0]);
  await step(page, 2);
  await intoMorning(page, 22);

  const { coldName, mem, prompt, rexMem } = await page.evaluate(() => {
    const w = window as W;
    const cold = (w.__coldSleepers as () => string[])();
    const name = cold[0];
    const memory = (w.__memory as () => Record<string, string[]>)();
    const greet = w.__greetPrompt as (n: string) => string | null;
    return {
      coldName: name,
      mem: memory[name] ?? [],
      prompt: name ? greet(name) : null,
      rexMem: memory['Rex'] ?? [],
    };
  });

  expect(coldName).toBeTruthy();
  expect(mem.some((e) => e.includes('🥶'))).toBe(true); // the cold sleeper remembers it
  expect(prompt).toContain('🥶'); // and the memory is woven into its greeting context
  expect(rexMem.some((e) => e.includes('🥶'))).toBe(false); // the bonded dino has no cold memory
});

test('a summer night that ends leaves no shiver — warm seasons are inert', async ({ page }) => {
  await boot(page);

  // Summer at 22:00: the huddle window never opens (BACKLOG-171), so the morning edge never fires
  // and, even if it did, summer is not a cold season.
  await stageNight(page, ['Rex', 'Mossback'], [10, 22, 0]);
  await step(page, 2);
  await intoMorning(page, 10);

  const { cold, anyFrozen } = await page.evaluate(() => {
    const w = window as W;
    const memory = (w.__memory as () => Record<string, string[]>)();
    const anyCold = Object.values(memory).some((events) => events.some((e) => e.includes('🥶')));
    return { cold: (w.__coldSleepers as () => string[])(), anyFrozen: anyCold };
  });

  expect(cold).toEqual([]);
  expect(anyFrozen).toBe(false);
});
