import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

// BACKLOG-193 — call and answer. The keeper hails, the dino answers after a pause, and the pause is
// the read: it shrinks as the dino warms to you. Headless-safe by construction — the beat is recorded
// in the scene (`__lastAnswer`), never in the AudioContext, exactly as BACKLOG-191 set up.

type W = Record<string, unknown>;

interface Answer {
  name: string;
  hearts: number;
  delayMs: number;
  params: { pitchHz: number; lengthMs: number; wobble: number; notes: number };
}

const lastAnswer = (p: Page) => p.evaluate(() => ((window as W).__lastAnswer as () => Answer | null)());
const lastSound = (p: Page) =>
  p.evaluate(() => ((window as W).__lastSound as () => { kind: string; name?: string } | null)());
const muted = (p: Page) => p.evaluate(() => ((window as W).__soundMuted as () => boolean)());
const hearts = async (p: Page, name: string) =>
  (await p.evaluate(() => ((window as W).__hearts as () => Record<string, number>)()))[name];
const greet = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__pickTone as (x: string, t: string) => Promise<void>)(n, 'warm'), name);

test('the keeper hails and the dino answers, with a gap between them', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await greet(page, 'Rex');

  // L7 — the hail is what the bowl made a sound of first. (The answer is scheduled, so on a fresh
  // save's ~780 ms gap this read lands inside it.)
  expect((await lastSound(page))?.kind).toBe('hail');

  // L6 — and the beat itself is recorded, naming the dino, its hearts and the pause.
  const a = await lastAnswer(page);
  expect(a?.name).toBe('Rex');
  expect(a?.hearts).toBe(0);
  expect(a?.delayMs).toBe(780);
  expect(a?.params.notes).toBeGreaterThan(0);

  // L7 — and after the gap, the sound the bowl last made is the dino's own call.
  await expect.poll(async () => (await lastSound(page))?.kind, { timeout: 4_000 }).toBe('chirp');
  expect((await lastSound(page))?.name).toBe('Rex');
});

test('a dino you have greeted a few times answers faster — no save edit, no clock skip', async ({ page }) => {
  // L8, the reachability criterion (CHARTER v7). Everything here is reachable from a fresh save by
  // walking up to a dino and pressing a key: no seeded friendship, no day boundary, no population floor.
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await greet(page, 'Rex');
  const cold = await lastAnswer(page);
  expect(cold?.hearts).toBe(0);

  // `greetGain` is 3-8 points a greet and a heart is 10, so a handful of hellos crosses the first one.
  for (let i = 0; i < 6 && (await hearts(page, 'Rex')) < 1; i++) {
    await greet(page, 'Rex');
    }
  expect(await hearts(page, 'Rex')).toBeGreaterThanOrEqual(1);

  await greet(page, 'Rex');
  const warm = await lastAnswer(page);
  expect(warm!.hearts).toBeGreaterThan(cold!.hearts);
  expect(warm!.delayMs).toBeLessThan(cold!.delayMs);
  // and the call itself is the eager one: shorter than the stranger's.
  expect(warm!.params.lengthMs).toBeLessThan(cold!.params.lengthMs);
});

test('muting silences the playback, not the beat', async ({ page }) => {
  // L9 — the `cryDistress` precedent: the dino answers the keeper in the world whether or not this
  // particular device is making noise about it.
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await page.keyboard.press('m');
  expect(await muted(page)).toBe(true);

  const before = await lastSound(page);
  await greet(page, 'Rex');

  expect(await lastAnswer(page)).not.toBeNull();
  expect((await lastAnswer(page))?.name).toBe('Rex');
  // nothing was played, so the last sound is whatever it already was
  expect(await lastSound(page)).toEqual(before);

  await page.keyboard.press('m'); // leave the device as we found it
});
