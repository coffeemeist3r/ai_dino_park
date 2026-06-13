import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Nobody came (BACKLOG-208). Cycle 47 thawed an unmended cold funk silently at dusk; this
 * fills the slot it left open: the dino the keeper never warmed files the colder memory
 * ("shivered all morning; nobody came") before the funk clears — neglect made as legible as
 * care. It compounds with the morning's cold note and tinges the next greeting. A dino the
 * keeper *did* warm left the funk set, so it never gets the neglect note.
 */

type W = Window & Record<string, any>;

/** Cycle-043 staging: bond a pair past the den bar, set a night clock, cross into morning. */
async function stageColdMorning(page: import('@playwright/test').Page, day = 22) {
  await page.evaluate((d) => {
    const w = window as W;
    w.__bondPair('Rex', 'Mossback', 12);
    w.__setClock(d, 20, 0);
    w.__stepWorld();
    w.__stepWorld();
    w.__setClock(d, 8, 0);
    w.__stepWorld(); // the window's closing edge — shivers, the cry, the funk
  }, day);
}

/** Cross the next winter dusk: the den window opens, thawing whatever funk is left. */
async function crossDusk(page: import('@playwright/test').Page, day = 22) {
  await page.evaluate((d) => {
    const w = window as W;
    w.__setClock(d, 19, 30);
    w.__stepWorld();
  }, day);
}

test('nobody came: an unmended funk leaves the colder memory, silently', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);

  const name = (await page.evaluate(() => (window as W).__coldPending() as string[]))[0];
  expect(name).toBeTruthy();

  await crossDusk(page);

  const result = await page.evaluate((n) => {
    const w = window as W;
    const mem = (w.__memory() as Record<string, string[]>)[n] ?? [];
    return {
      pending: w.__coldPending() as string[],
      neglected: mem.some((m) => m.includes('nobody came')),
      stillColdNote: mem.some((m) => m.includes('slept alone')), // the morning note compounds
      prompt: w.__greetPrompt(n) as string,
    };
  }, name);

  expect(result.pending).toEqual([]); // the funk is over, the mark gone
  expect(result.neglected).toBe(true); // but the hurt is remembered
  expect(result.stillColdNote).toBe(true); // neglect compounds, never overwrites the cold note
  expect(result.prompt).toContain('nobody came'); // it tinges the next greeting
});

test('the warmed dino is spared the neglect note; only the un-warmed carry it', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);

  // Need at least two cold sleepers to warm one and neglect the other.
  const pending = await page.evaluate(() => (window as W).__coldPending() as string[]);
  expect(pending.length).toBeGreaterThanOrEqual(2);

  const warmed = pending[0];
  const neglected = pending[1];

  await page.evaluate((n) => (window as W).__greet(n), warmed); // mend one by hand
  await crossDusk(page);

  const result = await page.evaluate(
    ([w1, n1]) => {
      const w = window as W;
      const mem = w.__memory() as Record<string, string[]>;
      const has = (name: string, frag: string) => (mem[name] ?? []).some((m) => m.includes(frag));
      return {
        warmedHasWarm: has(w1, 'the keeper warmed me'),
        warmedHasNeglect: has(w1, 'nobody came'),
        neglectedHasNeglect: has(n1, 'nobody came'),
        pending: w.__coldPending() as string[],
      };
    },
    [warmed, neglected],
  );

  expect(result.warmedHasWarm).toBe(true); // it was mended
  expect(result.warmedHasNeglect).toBe(false); // so it never gets the cold shoulder
  expect(result.neglectedHasNeglect).toBe(true); // the one nobody came for does
  expect(result.pending).toEqual([]); // dusk cleared everything either way
});
