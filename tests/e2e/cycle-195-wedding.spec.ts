import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 34, cycle 195. BACKLOG-624: a grudge at the rival bar turns a suitor down.
 * BACKLOG-625: at 15:00 a pair is wed at its nest, and its friends on that ground stand round it.
 */

type W = Record<string, any>;
type Nest = { zone: string; tileX: number; tileY: number };
type Pairs = Record<string, { mate: string; day: number; nest?: Nest; wed?: number }>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);
const TILE = 32;
const tileOf = (v: number) => Math.round((v - TILE / 2) / TILE);

async function start(page: Page, hour = 9): Promise<void> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, hour, 0);
}

test('the founding feud cannot pair: Twitch has not forgiven Mossback (BACKLOG-624)', async ({ page }) => {
  await start(page);
  // By bond the feud has become each other's closest friend, as it did on the cycle-194 probe; the founding grudge stands.
  await ev(page, '__bondPair', 'Mossback', 'Twitch', 60);
  expect((await ev<Record<string, number>>(page, '__grudges'))['Mossback|Twitch']).toBeGreaterThanOrEqual(20);
  await ev(page, '__court', 'Mossback', 'Twitch');
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker.some((l) => /^💔 (Mossback|Twitch) courts (Twitch|Mossback) with .+\. (Twitch|Mossback) hasn't forgiven (Mossback|Twitch)\.$/.test(l))).toBe(true);
  const pairs = await ev<Pairs>(page, '__pairs');
  expect(pairs.Mossback).toBeUndefined();
  expect(pairs.Twitch).toBeUndefined();
  expect(await ev<unknown[]>(page, '__nests')).toHaveLength(0);
  await ev(page, '__court', 'Rex', 'Sunny');
  expect((await ev<Pairs>(page, '__pairs')).Rex?.mate).toBe('Sunny');
});

test('Rex and Sunny are wed at their nest at 15:00, their friends stand round, and the save keeps the day (BACKLOG-625)', async ({ page }) => {
  await start(page, 14);
  await ev(page, '__court', 'Rex', 'Sunny');
  await ev(page, '__setClock', 1, 15, 0);
  const w = await ev<{ a: string; b: string; guests: string[] } | null>(page, '__holdWedding');
  expect(w).toMatchObject({ a: 'Rex', b: 'Sunny' });
  const pairs = await ev<Pairs>(page, '__pairs');
  expect(pairs.Rex.wed).toBe(1);
  expect(pairs.Sunny.wed).toBe(1);
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker.some((l) => l.startsWith('💍 Rex and Sunny are wed at their nest'))).toBe(true);
  expect(await ev(page, '__weddingMark')).toMatchObject({ visible: true });

  const nest = pairs.Rex.nest!;
  const zones = await ev<Record<string, string>>(page, '__saveZones');
  const local = w!.guests.filter((g) => (zones[g] ?? 'bowl') === nest.zone);
  expect(local.length).toBe(w!.guests.length);
  if (local.length) {
    let gathered = false;
    for (let i = 0; i < 20 && !gathered; i++) {
      await ev(page, '__stepWorld');
      const pos = await ev<Array<{ name: string; x: number; y: number }>>(page, '__dinoPositions');
      gathered = local.every((g) => {
        const p = pos.find((q) => q.name === g)!;
        return Math.abs(tileOf(p.x) - nest.tileX) <= 1 && Math.abs(tileOf(p.y) - nest.tileY) <= 1;
      });
    }
    expect(gathered).toBe(true);
  }
  const rows = await ev<Array<{ name: string; mate?: string }>>(page, '__bookRows');
  expect(rows.find((r) => r.name === 'Sunny')?.mate).toBe('💍 wed to Rex (day 1)');
  expect((await ev<Record<string, string[]>>(page, '__memory')).Rex).toContain('I was wed to Sunny at our nest');

  await ev(page, '__closeWedding');
  expect(await ev(page, '__weddingMark')).toBeNull();
  expect(await ev<string[]>(page, '__ticker')).toContain("💍 The guests drift home from Rex and Sunny's nest.");
  expect(await ev(page, '__holdWedding')).toBeNull(); // once

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => ((window as W).__pairs?.() as Pairs | undefined)?.Rex?.wed ?? null), { timeout: 30_000 }).toBe(1);
});

test('the wedding comes on its own, on the live cadence, at 15:00 (BACKLOG-625)', async ({ page }) => {
  await start(page, 14);
  await ev(page, '__court', 'Rex', 'Sunny');
  await ev(page, '__setClock', 1, 15, 0);
  await ev(page, '__resumeAmbient');
  await expect.poll(() => ev(page, '__wedding'), { timeout: 20_000 }).not.toBeNull();
  await ev(page, '__pauseAmbient');
});
