import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 28 (tentpole), cycle 184. BACKLOG-597: each season's festival has its own rite and a mark at the pond.
 * BACKLOG-595: greeted after a festival, a dino opens with how it went for it. Founding bonds and feud intact.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

async function openAt(page: Page, day: number) {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', day, 10, 0);
  return ev<{ season: string; attendees: string[]; leader: string }>(page, '__checkFestival');
}

test('spring raises the blossom ring at the pond, and takes it down at the close (BACKLOG-597)', async ({ page }) => {
  const f = await openAt(page, 1);
  expect(f.season).toBe('spring');
  expect(await ev(page, '__festivalMark')).toEqual({ key: 'festival-spring', tileX: 5, tileY: 3 });
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem.Sunny).toContain('opened the spring festival — led the blossom ring');
  expect(mem.Rex).toContain('the spring festival — the blossom ring; Sunny opened it');
  await ev(page, '__closeFestival');
  expect(await ev(page, '__festivalMark')).toBeNull();
});

test("winter's festival is a lantern vigil, not spring's ring (BACKLOG-597)", async ({ page }) => {
  const f = await openAt(page, 22);
  expect(f.season).toBe('winter');
  expect(await ev(page, '__festivalMark')).toMatchObject({ key: 'festival-winter' });
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem.Rex).toContain('the winter festival — the lantern vigil; Sunny opened it');
});

test('after the festival Sunny is proud of it once, and Mossback is sore about Twitch (BACKLOG-595)', async ({ page }) => {
  const f = await openAt(page, 1);
  expect(await ev(page, '__festivalTales')).toEqual({});
  await ev(page, '__closeFestival');
  const tales = await ev<Record<string, { foe?: string }>>(page, '__festivalTales');
  expect(Object.keys(tales).sort()).toEqual([...f.attendees].sort());
  expect(tales.Mossback.foe).toBe('Twitch');

  const first = await ev<string>(page, '__pickTone', 'Sunny', 'warm');
  expect(first).toContain('the spring festival');
  expect(first).toMatch(/I opened the spring festival|Somebody had to open the spring festival/);
  const second = await ev<string>(page, '__pickTone', 'Sunny', 'warm');
  expect(second).not.toContain('spring festival');

  const moss = await ev<string>(page, '__pickTone', 'Mossback', 'warm');
  expect(moss).toContain('Twitch was there, so I kept to the edge.');
});
