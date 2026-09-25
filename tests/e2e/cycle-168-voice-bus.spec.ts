import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-559 — one bus for every voice.
 *
 * The arithmetic is pinned by `game/src/audio/cycle-168-mix.test.ts`; this walks the reachable half.
 * Two levels that could not be expressed before the bus existed now are, and both are audible on a
 * fresh save: the keeper's hail sits back behind the answer it asks for, and a cry carries.
 *
 * Headless-safe by construction, like every audio spec since 191: the kind is recorded at the call
 * site in the scene, never read out of the AudioContext.
 */

type W = Record<string, unknown>;

const lastSound = (p: Page) =>
  p.evaluate(() => ((window as W).__lastSound as () => { kind: string; name?: string } | null)());
const greet = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__pickTone as (x: string, t: string) => Promise<void>)(n, 'warm'), name);

test('the hail and the answer are different kinds through one bus', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await greet(page, 'Rex');

  // The watcher calls first, and it is not a creature — its own kind, its own level.
  expect((await lastSound(page))?.kind).toBe('hail');

  // Then the dino answers, at the bowl's level, in its own voice.
  await expect.poll(async () => (await lastSound(page))?.kind, { timeout: 4_000 }).toBe('chirp');
  expect((await lastSound(page))?.name).toBe('Rex');

  // The bus is created inside unlockAudio; a headless context with no real audio must not throw.
  expect(errors).toEqual([]);
});

test('a cry is its own kind, and no longer records as a plain chirp', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  // Rapping the glass startles whoever is near it, and a startled dino cries out (BACKLOG-194).
  await page.evaluate(() => ((window as W).__tapGlass as (x: number, y: number) => unknown)(200, 200));

  await expect.poll(async () => (await lastSound(page))?.kind, { timeout: 4_000 }).toBe('distress');
});
