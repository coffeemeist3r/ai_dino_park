import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type Jealousy = { name: string; line: string; memory: string } | null;
type Homecoming = { name: string; hearts: number; line: string; memory: string; jealous: Jealousy } | null;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[]; homecoming: Homecoming };
type Comfort = { comforter: string; sulker: string } | null;

// 12 in-game hours of real time at 1×: past the 6h homecoming gate, under the 1-day
// away-drift threshold — so the only bond change is the comfort beat itself.
const HALF_DAY_MS = 12 * 60 * 60_000;
// Greet gain is per-dino (>=3/greet), so equal greet COUNTS don't tie. Saturating two
// dinos to the 100-point cap gives an EXACT tie → topBy picks the alpha-min as homecomer
// and the next as the sulking runner-up, fully deterministically. >=34 greets reaches 100
// at the minimum gain of 3; 40 is comfortable headroom.
const SATURATE = 40;
// Cast alpha order: Glade < Mossback < Rex < Sunny < Twitch. We choose roles to fit it.

const greet = (page: import('@playwright/test').Page, name: string, n = 1) =>
  page.evaluate(
    ({ name, n }) => {
      const g = (window as W).__greet as (x: string) => number;
      for (let i = 0; i < n; i++) g(name);
    },
    { name, n },
  );
const bondPair = (page: import('@playwright/test').Page, a: string, b: string, n = 1) =>
  page.evaluate(
    ({ a, b, n }) => {
      const bp = (window as W).__bondPair as (x: string, y: string) => number;
      for (let i = 0; i < n; i++) bp(a, b);
    },
    { a, b, n },
  );
const catchUp = (page: import('@playwright/test').Page, ms: number) =>
  page.evaluate((m) => ((window as W).__catchUp as (x: number) => CatchUp)(m), ms);
const lastComfort = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__lastComfort as () => Comfort)());
const gratitude = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__gratitude as () => Record<string, string[]>)());

test('a consoled dino files who consoled it (BACKLOG-132)', async ({ page }) => {
  await boot(page);
  // Saturate Glade + Rex → exact tie → Glade homecomes (alpha), Rex sulks. Mossback is Rex's
  // closest friend, so it crosses over to console him.
  await greet(page, 'Glade', SATURATE);
  await greet(page, 'Rex', SATURATE);
  await bondPair(page, 'Rex', 'Mossback', 2); // ~16, clears the floor

  const result = await catchUp(page, HALF_DAY_MS);
  expect(result.homecoming!.name).toBe('Glade');
  expect(result.homecoming!.jealous!.name).toBe('Rex');

  // Mossback consoled Rex, and Rex now owes Mossback.
  expect(await lastComfort(page)).toEqual({ comforter: 'Mossback', sulker: 'Rex' });
  expect((await gratitude(page)).Rex).toContain('Mossback');
});

test('the consoled dino echoes the favor when its comforter later sulks, beating a stronger-bond peer (BACKLOG-132)', async ({ page }) => {
  await boot(page);

  // --- Round 1: Mossback consoles Rex → Rex owes Mossback. ---
  await greet(page, 'Glade', SATURATE);
  await greet(page, 'Rex', SATURATE);
  await bondPair(page, 'Rex', 'Mossback', 2); // Rex's closest friend (~16)
  await bondPair(page, 'Mossback', 'Twitch', 4); // Mossback's STRONGEST bond is Twitch (~32 > Rex's ~16)

  const r1 = await catchUp(page, HALF_DAY_MS);
  expect(r1.homecoming!.jealous!.name).toBe('Rex');
  expect(await lastComfort(page)).toEqual({ comforter: 'Mossback', sulker: 'Rex' });
  expect((await gratitude(page)).Rex).toContain('Mossback');

  // --- Round 2: make Mossback the sulker. Saturate Mossback too → top group {Glade,Rex,Mossback}
  // all at 100; Glade homecomes (alpha), and the runner-up is the next alpha after Glade = Mossback. ---
  await greet(page, 'Mossback', SATURATE);

  const r2 = await catchUp(page, HALF_DAY_MS);
  expect(r2.homecoming!.name).toBe('Glade');
  expect(r2.homecoming!.jealous!.name).toBe('Mossback');

  // The echo: Rex (the grateful debtor) crosses over — NOT Twitch, who has the higher bond with Mossback.
  expect(await lastComfort(page)).toEqual({ comforter: 'Rex', sulker: 'Mossback' });

  // A 🫂 bubble naming the debtor is alive in the same beat as Mossback's 😒 sulk.
  const bubbles = await page.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
  expect(bubbles.some((t) => t.includes('🫂') && t.includes('Rex'))).toBe(true);
  expect(bubbles.some((t) => t.includes('😒') && t.includes('Mossback'))).toBe(true);
});
