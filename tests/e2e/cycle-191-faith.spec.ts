import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 32, cycle 191. BACKLOG-030: the first sermon — at the day-one festival's close the most curious awake bowl
 * dino preaches, love believes and a grudge in the way scoffs. BACKLOG-613: the faith is in the save, and the faithful
 * gather at the sermon spot at 16:00.
 */

type W = Record<string, any>;
type Faith = { creed: string; preacher: string; zone: string; tileX: number; tileY: number; day: number; believers: string[]; scoffers: Record<string, string> };
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

async function preach(page: Page): Promise<Faith> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await ev(page, '__faith')).toBeNull();
  await ev(page, '__setClock', 1, 10, 0);
  await ev(page, '__checkFestival');
  await ev(page, '__closeFestival');
  return ev<Faith>(page, '__faith');
}

test('the festival closes and Glade preaches the song; who loves it believes, Twitch scoffs (BACKLOG-030)', async ({ page }) => {
  const f = await preach(page);
  expect(f).toMatchObject({ preacher: 'Glade', creed: 'song', zone: 'bowl', day: 1 });
  expect(f.believers.length).toBeGreaterThan(0);
  const bonds = await ev<Record<string, number>>(page, '__bonds');
  const bond = (a: string, b: string) => bonds[[a, b].sort().join('|')] ?? 0;
  for (const b of f.believers) expect(bond('Glade', b)).toBeGreaterThanOrEqual(10);
  expect(f.scoffers.Twitch).toBe('Mossback');

  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker.some((l) => l.startsWith('🎶 Glade stays at the pond and preaches'))).toBe(true);
  expect(ticker.some((l) => l.includes('believe Glade.') || l.includes('believes Glade.'))).toBe(true);
  expect((await ev<Record<string, string[]>>(page, '__memory')).Glade).toContain("I stood up at the festival's end and told them about the song under the grass");
  expect(await ev(page, '__faithMark')).toMatchObject({ tileX: f.tileX, tileY: f.tileY, visible: true });

  const rows = await ev<Array<{ name: string; faith?: string }>>(page, '__bookRows');
  const line = (n: string) => rows.find((r) => r.name === n)?.faith;
  expect(line('Glade')).toBe('🎶 preaches the song under the grass (since day 1)');
  expect(line(f.believers[0])).toBe("🎶 follows Glade's word: the song under the grass");
  expect(line('Twitch')).toBe("🙄 won't hear Glade's song — not where Mossback goes");

  // One faith per park: a second festival's close preaches nothing new.
  await ev(page, '__setClock', 8, 10, 0);
  await ev(page, '__checkFestival');
  await ev(page, '__closeFestival');
  expect((await ev<Faith>(page, '__faith')).day).toBe(1);
});

test('a believer idles with the creed glyph now and then (BACKLOG-030)', async ({ page }) => {
  const f = await preach(page);
  for (let i = 0; i < 40 && (await ev(page, '__festival')); i++) await ev(page, '__stepWorld');
  let seen = false;
  for (let i = 0; i < 40 && !seen; i++) {
    await ev(page, '__stepWorld');
    for (const n of [f.preacher, ...f.believers]) {
      if ((await ev(page, '__activity', n)) !== 'wandering') continue;
      if ((await ev<string>(page, '__activityMark', n)) === '🎶') seen = true;
    }
  }
  expect(seen).toBe(true);
});

test('at 16:00 the faithful gather at the sermon spot, and the faith survives a reload (BACKLOG-613)', async ({ page }) => {
  const f = await preach(page);
  for (let i = 0; i < 40 && (await ev(page, '__festival')); i++) await ev(page, '__stepWorld');
  expect(await ev(page, '__festival')).toBeNull();
  await ev(page, '__setClock', 1, 15, 30);
  expect(await ev(page, '__holdService')).toBeNull();
  await ev(page, '__setClock', 1, 16, 0);
  const s = await ev<{ attendees: string[] }>(page, '__holdService');
  expect(s.attendees).toContain('Glade');
  expect(s.attendees.length).toBeGreaterThanOrEqual(2);
  expect((await ev<string[]>(page, '__ticker')).some((l) => l.startsWith("🎶 Glade's faithful gather at the pond"))).toBe(true);

  const near = async () => {
    const pos = await ev<Array<{ name: string; x: number; y: number }>>(page, '__dinoPositions');
    return s.attendees.every((n) => {
      const p = pos.find((d) => d.name === n)!;
      return Math.abs(Math.floor(p.x / 32) - f.tileX) <= 1 && Math.abs(Math.floor(p.y / 32) - f.tileY) <= 1;
    });
  };
  let gathered = false;
  for (let i = 0; i < 30 && !gathered; i++) {
    await ev(page, '__stepWorld');
    gathered = await near();
  }
  expect(gathered).toBe(true);
  await ev(page, '__closeService');
  expect((await ev<string[]>(page, '__ticker')).some((l) => l === '🎶 The faithful drift off from the pond.')).toBe(true);

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => ((window as W).__faith?.() as Faith | null | undefined)?.preacher ?? null), { timeout: 30_000 })
    .toBe('Glade');
  const back = await ev<Faith & { lastServiceDay?: number }>(page, '__faith');
  expect(back.believers.sort()).toEqual([...f.believers].sort());
  expect(back.lastServiceDay).toBe(1);
});
