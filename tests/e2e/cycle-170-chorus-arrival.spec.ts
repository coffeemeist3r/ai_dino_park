import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-200 + BACKLOG-198 (with BACKLOG-562's player underneath) — the ground calls you in.
 *
 * The chorus arithmetic is pinned by `game/src/audio/cycle-170-chorus.test.ts`; this walks the
 * reachable half. The only chorus the park had fired at 07:00, twenty-three real minutes past a fresh
 * save. Walking onto a ground is the moment a keeper lives through, and now its residents sing as you
 * arrive, with the bond graph in the song.
 *
 * No bond hook is touched: the park is stepped until the founding cast has made friends on its own,
 * which is the reachability demonstration (cycle 169 measured the first pair inside 40 steps).
 */

type W = Record<string, any>;
type Arrival = { zone: string; pairs: [string, string][]; late: string[]; cues: { name: string; delayMs: number }[] };

const lastArrival = (p: Page) => p.evaluate(() => (window as W).__lastArrival() as Arrival | null);
const ticker = (p: Page) => p.evaluate(() => (window as W).__ticker() as string[]);
const callNotes = (p: Page) => p.evaluate(() => (window as W).__callNotes() as number);
const zone = (p: Page) => p.evaluate(() => (window as W).__zone() as string);
const cross = (p: Page, x: number) =>
  p.evaluate((x) => {
    (window as W).__setPlayer(x, 240);
    (window as W).__tryCross();
  }, x);
const toGrove = (p: Page) => cross(p, 630);
const toBowl = (p: Page) => cross(p, 10);
const songs = async (p: Page) => (await ticker(p)).filter((l) => l.includes('🎶')).length;
const wallMsFor = async (p: Page, mins: number) =>
  (mins * 60_000) / (await p.evaluate(() => (window as W).__clockScale() as number));

/**
 * Will the Bowl sing a pair? Exactly when any two Bowl residents are bonded over the loner floor: the
 * closest pair among the singers is always mutual, so one bond over the line is enough. Read-only.
 */
const bowlPairExists = (p: Page) =>
  p.evaluate(() => {
    const w = window as W;
    const bonds = w.__bonds() as Record<string, number>;
    const bowl = (w.__dinoNames() as string[]).filter((n) => w.__homeZone(n) === 'bowl');
    return bowl.some((a) => bowl.some((b) => a < b && (bonds[`${a}|${b}`] ?? 0) >= 8));
  });

/** Let the park be a park until the Bowl has a pair — no hooks that write. */
const liveUntilPair = async (p: Page) => {
  for (let i = 0; i < 30 && !(await bowlPairExists(p)); i++) {
    for (let k = 0; k < 20; k++) await p.evaluate(() => (window as W).__stepWorld());
  }
  expect(await bowlPairExists(p), 'the Bowl never made a pair of friends on its own').toBe(true);
};

test('walking back into the Bowl, its pair sings as one and the ticker names them', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  expect(await lastArrival(page)).toBeNull(); // boot is not an arrival

  await liveUntilPair(page);
  await toGrove(page);
  expect(await zone(page)).toBe('grove');
  expect((await lastArrival(page))!.zone).toBe('grove');

  const notesBefore = await callNotes(page);
  await toBowl(page);
  const a = (await lastArrival(page))!;
  expect(a.zone).toBe('bowl');
  expect(a.cues.map((c) => c.name).sort()).toEqual(
    (await page.evaluate(() => ((window as W).__dinoNames() as string[]).filter((n) => (window as W).__homeZone(n) === 'bowl'))).sort(),
  );
  expect(a.pairs.length).toBeGreaterThanOrEqual(1);

  // The partner lands just behind its leader — inside one pip stride (≤ 350 ms call, ≤ 403 ms stride).
  const at = new Map(a.cues.map((c) => [c.name, c.delayMs]));
  for (const [lead, partner] of a.pairs) {
    expect(at.get(partner)!).toBeGreaterThan(at.get(lead)!);
    expect(at.get(partner)! - at.get(lead)!).toBeLessThan(210);
  }
  // Any loner comes in after everybody else.
  const rest = a.cues.filter((c) => !a.late.includes(c.name)).map((c) => c.delayMs);
  for (const n of a.late) expect(at.get(n)!).toBeGreaterThan(Math.max(...rest));

  const line = (await ticker(page)).filter((l) => l.includes('🎶')).at(-1)!;
  expect(line).toContain('Pocket Cretaceous');
  for (const [x, y] of a.pairs) expect(line).toContain(`${x} & ${y} as one`);

  // A ♪ over every Bowl singer as its cue plays.
  await page.waitForFunction((n) => ((window as W).__callNotes() as number) >= n, notesBefore + a.cues.length);
  expect(errors).toEqual([]);
});

test('a ground rests after it sings, then sings again', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await toGrove(page);
  await toBowl(page);
  const before = await songs(page);
  expect(before).toBe(2);

  await toGrove(page);
  await toBowl(page);
  expect(await songs(page)).toBe(before); // both grounds resting

  await page.evaluate(async (ms) => (window as W).__advanceWall(ms), await wallMsFor(page, 181));
  await toGrove(page);
  expect(await songs(page)).toBe(before + 1);
  expect((await lastArrival(page))!.zone).toBe('grove');
});

test('muted, the arrival still shows: the line and the ♪ marks, and nothing plays', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyM');
  await settle(page);
  expect(await page.evaluate(() => (window as W).__soundMuted())).toBe(true);
  const soundBefore = await page.evaluate(() => JSON.stringify((window as W).__lastSound()));

  await toGrove(page);
  expect((await ticker(page)).some((l) => l.includes('🎶') && l.includes('The Grove'))).toBe(true);
  await page.waitForFunction(() => ((window as W).__callNotes() as number) >= 2); // Bramble and Pip
  expect(await callNotes(page)).toBe(2);
  expect(await page.evaluate(() => JSON.stringify((window as W).__lastSound()))).toBe(soundBefore);
});

test('the test jump is not an arrival', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await lastArrival(page)).toBeNull();
});
