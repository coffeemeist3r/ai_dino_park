import { test, expect } from '@playwright/test';
import { boot, gatherToBowl } from './helpers';
import { driftFor } from '../../game/src/world/away';

type W = Record<string, unknown>;
type Jealousy = { name: string; line: string; memory: string } | null;
type Homecoming = { name: string; hearts: number; line: string; memory: string; jealous: Jealousy } | null;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[]; homecoming: Homecoming };
type Comfort = { comforter: string; sulker: string } | null;

// 12 in-game hours of real time at 1×: past the 6h homecoming gate. It also clears
// `AWAY_BEAT_MIN_MINUTES` (BACKLOG-113), so a companion pair drifts as well — the specs below name that
// drift through `driftFor` rather than assuming it away, which is what they used to do.
const HALF_DAY_MS = 12 * 60 * 60_000;
const COMFORT_BOND = 2;

const bondKey = (a: string, b: string) => [a, b].sort().join('|');

test('a sulking runner-up is consoled by its closest friend with a 🫂 and a bond bump (BACKLOG-130)', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page); // CHARTER v7: this case needs the cast co-located in the bowl

  // Near-tie between Sunny and Glade (one greet each), and make Twitch the strong
  // friend of *both* so it's the comforter whichever of them ends up sulking.
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    const bondPair = (window as W).__bondPair as (a: string, b: string) => number;
    greet('Sunny');
    greet('Glade');
    bondPair('Sunny', 'Twitch'); bondPair('Sunny', 'Twitch'); // ~16, clears the floor
    bondPair('Glade', 'Twitch'); bondPair('Glade', 'Twitch');
  });

  const bonds = () => page.evaluate(() => ((window as W).__bonds as () => Record<string, number>)());
  const before = await bonds();

  const result: CatchUp = await page.evaluate((ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms), HALF_DAY_MS);
  expect(result.homecoming?.jealous).not.toBeNull();
  const sulker = result.homecoming!.jealous!.name;

  // Twitch came over.
  const comfort: Comfort = await page.evaluate(() => ((window as W).__lastComfort as () => Comfort)());
  expect(comfort).toEqual({ comforter: 'Twitch', sulker });

  // A 🫂 bubble naming the comforter is alive in the same beat as the 😒 sulk.
  const bubbles = await page.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
  expect(bubbles.some((t) => t.includes('🫂') && t.includes('Twitch'))).toBe(true);
  expect(bubbles.some((t) => t.includes('😒') && t.includes(sulker))).toBe(true);

  // The Twitch↔sulker bond grew by COMFORT_BOND, plus what the absence itself is worth.
  //
  // BACKLOG-113: the parenthetical that used to sit here read "no away-drift on a sub-day span", and it was
  // an assumption this spec was standing on rather than a fact it had checked. It was true only because the
  // catch-up's drift beats were gated on a whole in-game day, which at `AWAY_SCALE = 1` is twenty-four real
  // hours — the reason the digest was unreachable in a session at all. Now a half-day away moves a
  // companion pair, and this pair is one. The subject of the spec is unchanged: what the *comfort* is worth.
  const after = await bonds();
  const key = bondKey('Twitch', sulker);
  expect(after[key] - before[key]).toBe(COMFORT_BOND + driftFor(HALF_DAY_MS / 60_000));
});

test('with no close friend, the sulk stands alone and the repair path is untouched (BACKLOG-130)', async ({ page }) => {
  await boot(page);

  // Stage the same jealousy, but leave every bond at zero — nobody clears the floor.
  await page.evaluate(() => {
    const greet = (window as W).__greet as (n: string) => number;
    greet('Sunny');
    greet('Glade');
  });

  const result: CatchUp = await page.evaluate((ms) => ((window as W).__catchUp as (m: number) => CatchUp)(ms), HALF_DAY_MS);
  expect(result.homecoming?.jealous).not.toBeNull();
  const sulker = result.homecoming!.jealous!.name;

  // No comforter crossed over.
  const comfort: Comfort = await page.evaluate(() => ((window as W).__lastComfort as () => Comfort)());
  expect(comfort).toBeNull();

  // The sulk still shows, no 🫂.
  const bubbles = await page.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
  expect(bubbles.some((t) => t.includes('😒') && t.includes(sulker))).toBe(true);
  expect(bubbles.some((t) => t.includes('🫂'))).toBe(false);

  // BACKLOG-125 repair seam unchanged: the sulker is still queued for a make-up greet.
  const pending = await page.evaluate(() => ((window as W).__pendingRepair as () => string | null)());
  expect(pending).toBe(sulker);
});
