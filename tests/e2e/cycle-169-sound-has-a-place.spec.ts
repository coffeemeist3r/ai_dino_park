import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-206 — sound has a place.
 *
 * The curve is pinned by `game/src/audio/cycle-169-space.test.ts`; this walks the reachable half:
 * where the keeper chooses to stand changes what the keeper hears. That has never been true of this
 * park before — every call has arrived at one level per kind since the voicebox shipped in cycle 44.
 *
 * Headless-safe: the level is recorded at the call site as `lastSound.gain`, never read out of an
 * AudioContext, exactly as every audio spec since 191 records its intent.
 */

type W = Record<string, unknown>;

const TILE = 32;
const at = (tile: number) => tile * TILE + TILE / 2;

const lastSound = (p: Page) =>
  p.evaluate(() => ((window as W).__lastSound as () => { kind: string; name?: string; gain: number } | null)());
const greet = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__pickTone as (x: string, t: string) => Promise<void>)(n, 'warm'), name);
const place = (p: Page, name: string, tx: number, ty: number) =>
  p.evaluate(([n, x, y]) => ((window as W).__placeDino as (a: string, b: number, c: number) => boolean)(n as string, x as number, y as number), [name, tx, ty] as const);
const stand = (p: Page, x: number, y: number) =>
  p.evaluate(([px, py]) => ((window as W).__setPlayer as (a: number, b: number) => void)(px, py), [x, y] as const);

/** The answer comes back after a pause that shrinks with hearts (193), so poll rather than wait. */
async function gainOfAnswer(page: Page, name: string): Promise<number> {
  await greet(page, name);
  await expect
    .poll(async () => {
      const s = await lastSound(page);
      return s?.kind === 'chirp' && s?.name === name;
    }, { timeout: 5_000 })
    .toBe(true);
  return (await lastSound(page))!.gain;
}

test('a dino across the tank arrives quieter than one at your elbow — and is still audible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  // Rex stands in the near corner, Twitch in the far one. The ground is 20x15 tiles.
  expect(await place(page, 'Rex', 2, 2)).toBe(true);
  expect(await place(page, 'Twitch', 18, 13)).toBe(true);

  // Stand with Rex and call.
  await stand(page, at(2), at(2));
  const near = await gainOfAnswer(page, 'Rex');

  // Same keeper, same kind of call, other end of the ground.
  const far = await gainOfAnswer(page, 'Twitch');

  expect(far).toBeLessThan(near);
  // ...and the floor holds: distance is faintness, never silence. A call that faded to nothing would
  // be a beat the player could not know they missed.
  expect(far).toBeGreaterThan(0);

  expect(errors).toEqual([]);
});

test('the book is a readout, not a sound standing on the ground', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  // Put every dino as far from the keeper as the ground allows, then read the book from the corner.
  await stand(page, at(0), at(0));
  expect(await place(page, 'Rex', 19, 14)).toBe(true);

  for (let i = 0; i < 8; i++) {
    if ((await page.evaluate(() => ((window as W).__lens as () => string)?.())) === 'book') break;
    await page.keyboard.press('KeyV');
    await settle(page);
  }
  expect(await page.evaluate(() => ((window as W).__lens as () => string)?.())).toBe('book');

  await page.keyboard.press('KeyN');
  await settle(page);

  // Full level regardless of where anybody is standing: attenuating the book would make it quieter
  // for exactly the dinos you have not walked to yet, which is the opposite of what a book is for.
  const s = await lastSound(page);
  expect(s?.kind).toBe('chirp');
  expect(s?.gain).toBeCloseTo(0.12, 10);
});
