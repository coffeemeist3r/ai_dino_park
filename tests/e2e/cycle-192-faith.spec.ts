import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 32, cycle 192. BACKLOG-615: the word travels — a believer tells a friend who missed the sermon, in an
 * ordinary meeting, and the book says who told it. BACKLOG-614: at the service three believers haul stone out of the
 * bowl's pile and raise a shrine where the sermon was given, a landmark owed upkeep like any other.
 */

type W = Record<string, any>;
type Shrine = { tileX: number; tileY: number; zone: string; derelict?: boolean };
type Faith = { preacher: string; zone: string; tileX: number; tileY: number; believers: string[]; scoffers: Record<string, string>; heardFrom?: Record<string, string>; shrine?: Shrine };
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

async function preach(page: Page): Promise<Faith> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, 10, 0);
  await ev(page, '__checkFestival');
  await ev(page, '__closeFestival');
  for (let i = 0; i < 40 && (await ev(page, '__festival')); i++) await ev(page, '__stepWorld');
  return ev<Faith>(page, '__faith');
}

test('Rex slept through the sermon and hears it from Sunny in a meeting (BACKLOG-615)', async ({ page }) => {
  const f = await preach(page);
  expect(f.believers).toContain('Sunny');
  expect(f.believers).not.toContain('Rex');

  await ev(page, '__forceConverse', 'Rex', 'Sunny'); // Rex speaks; Sunny still carries the word
  const after = await ev<Faith>(page, '__faith');
  expect(after.believers).toContain('Rex');
  expect(after.heardFrom?.Rex).toBe('Sunny');
  expect((await ev<string[]>(page, '__ticker')).some((l) => l === "🎶 Rex heard Glade's song from Sunny, and believes.")).toBe(true);
  expect((await ev<Record<string, string[]>>(page, '__memory')).Rex).toContain('Sunny told me about the song under the grass, and I believed it');
  const rows = await ev<Array<{ name: string; faith?: string }>>(page, '__bookRows');
  expect(rows.find((r) => r.name === 'Rex')?.faith).toBe("🎶 follows Glade's word: the song under the grass (heard it from Sunny)");

  // Told once: a second meeting changes nothing.
  await ev(page, '__forceConverse', 'Sunny', 'Rex');
  expect((await ev<Faith>(page, '__faith')).believers.filter((b) => b === 'Rex')).toHaveLength(1);

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => ((window as W).__faith?.() as Faith | null | undefined)?.heardFrom?.Rex ?? null), { timeout: 30_000 })
    .toBe('Sunny');
});

test('a grudge against the one telling it scoffs (BACKLOG-615)', async ({ page }) => {
  await preach(page);
  await ev(page, '__setGrudge', 'Rex', 'Sunny', 40);
  await ev(page, '__hearWord', 'Sunny', 'Rex');
  const f = await ev<Faith>(page, '__faith');
  expect(f.believers).not.toContain('Rex');
  expect(f.scoffers.Rex).toBe('Sunny');
  expect((await ev<string[]>(page, '__ticker')).some((l) => l === "🙄 Rex won't hear Glade's song from Sunny.")).toBe(true);
});

test('at the service the faithful haul two stone and raise a shrine at the sermon spot (BACKLOG-614)', async ({ page }) => {
  const f = await preach(page);
  expect(f.believers.length).toBeGreaterThanOrEqual(3);
  await ev(page, '__setZonePile', 'bowl', { stone: 3, branch: 1 });
  const before = await ev<number>(page, '__standing', 'bowl');
  await ev(page, '__setClock', 1, 16, 0);
  const s = await ev<{ attendees: string[] } | null>(page, '__holdService');
  expect(s?.attendees.length).toBeGreaterThanOrEqual(3);

  const after = await ev<Faith>(page, '__faith');
  expect(after.shrine).toEqual({ tileX: f.tileX, tileY: f.tileY, zone: 'bowl' });
  expect(await ev(page, '__zoneStockpile', 'bowl')).toEqual({ stone: 1, branch: 1 });
  expect(await ev<number>(page, '__standing', 'bowl')).toBe(before + 1);
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker.some((l) => l.startsWith('🛐 ') && l.endsWith('haul stone from the pile and raise a shrine where Glade preached.'))).toBe(true);
  expect(await ev(page, '__faithMark')).toMatchObject({ tileX: f.tileX, tileY: f.tileY, shrine: true, alpha: 1 });

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => ((window as W).__faith?.() as Faith | null | undefined)?.shrine?.zone ?? null), { timeout: 30_000 })
    .toBe('bowl');
});

test('short of stone the service still gathers and nothing is raised (BACKLOG-614)', async ({ page }) => {
  await preach(page);
  await ev(page, '__setZonePile', 'bowl', { stone: 1 });
  await ev(page, '__setClock', 1, 16, 0);
  expect(await ev(page, '__holdService')).not.toBeNull();
  expect((await ev<Faith>(page, '__faith')).shrine).toBeUndefined();
  expect(await ev(page, '__zoneStockpile', 'bowl')).toEqual({ stone: 1 });
});

test('a shrine the bowl cannot keep up lapses into its ruin, like any wall (BACKLOG-614/619)', async ({ page }) => {
  await preach(page);
  await ev(page, '__setZonePile', 'bowl', { stone: 2 });
  await ev(page, '__setClock', 1, 16, 0);
  await ev(page, '__holdService');
  expect((await ev<Faith>(page, '__faith')).shrine).toBeTruthy();
  // Two more walls on the bowl make the bill one unit a day; an empty pile cannot pay it.
  await ev(page, '__seedGranaryReady', 'bowl', 2);
  await ev(page, '__setZonePile', 'bowl', {});
  const lines = await ev<string[]>(page, '__runUpkeep', 1);
  expect(lines.some((l) => l.includes('🛐'))).toBe(true);
  expect((await ev<Faith>(page, '__faith')).shrine?.derelict).toBe(true);
  // BACKLOG-619 (cycle 193-art): the lapse now swaps to the drawn ruin at full opacity instead of fading.
  expect(await ev(page, '__faithMark')).toMatchObject({ alpha: 1, texture: 'prop_shrine_derelict' });
});
