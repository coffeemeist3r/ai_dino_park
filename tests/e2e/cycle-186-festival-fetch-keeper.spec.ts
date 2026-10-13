import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 29, cycle 186. BACKLOG-133: the festival's leader walks out to each sulker at the edge and asks it in; a
 * sulker that is not prickly comes into the circle, a prickly one refuses to its face. BACKLOG-600: the keeper standing
 * in the ring is an attendee — the leader welcomes it, the circle's hearts tick, and the tales say whether it came.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const TILE = 32;
const FESTIVAL = { tileX: 6, tileY: 4 };
const placeKeeper = (p: Page, tileX: number, tileY: number) => ev(p, '__setPlayer', tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);

async function openSpring(page: Page, keeperAt: [number, number]) {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await placeKeeper(page, ...keeperAt);
  await ev(page, '__setClock', 1, 10, 0);
  return ev<{ leader: string; sulkers: Record<string, string>; attendees: string[] }>(page, '__checkFestival');
}

async function ringOf(page: Page, name: string): Promise<number> {
  const all = await ev<{ name: string; x: number; y: number }[]>(page, '__dinoPositions');
  const d = all.find((p) => p.name === name)!;
  return Math.max(Math.abs(Math.floor(d.x / TILE) - FESTIVAL.tileX), Math.abs(Math.floor(d.y / TILE) - FESTIVAL.tileY));
}

test('Sunny walks out to the edge: Mossback refuses, Twitch comes in (BACKLOG-133)', async ({ page }) => {
  const f = await openSpring(page, [17, 12]);
  expect(f.leader).toBe('Sunny');
  expect(f.sulkers).toEqual({ Mossback: 'Twitch', Twitch: 'Mossback' });
  const grudgeBefore = (await ev<Record<string, number>>(page, '__grudges'))['Mossback|Twitch'];
  const bondsBefore = await ev<Record<string, number>>(page, '__bonds');
  for (let i = 0; i < 10; i++) await ev(page, '__stepWorld');
  const started = await ev<{ coax: string[] }>(page, '__coaxFestival');
  expect([...started.coax].sort()).toEqual(['Mossback', 'Twitch']);
  for (let i = 0; i < 40 && (await ev<{ coax: string[] }>(page, '__festivalCoax')).coax.length; i++) await ev(page, '__stepWorld');
  expect(await ev(page, '__festivalCoax')).toEqual({ coax: [], fetched: ['Twitch'], refused: ['Mossback'] });
  expect((await ev<{ sulkers: Record<string, string> }>(page, '__festival')).sulkers).toEqual({ Mossback: 'Twitch' });
  const bondsMid = await ev<Record<string, number>>(page, '__bonds');
  expect(bondsMid['Sunny|Twitch'] ?? 0).toBeGreaterThanOrEqual((bondsBefore['Sunny|Twitch'] ?? 0) + 10 - 1e-6);
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker).toContain('🤝 Sunny fetched Twitch in from the edge');
  expect(ticker).toContain("😤 Mossback wouldn't come in from the edge");

  for (let i = 0; i < 12; i++) await ev(page, '__stepWorld');
  expect(await ringOf(page, 'Twitch')).toBeLessThanOrEqual(2);
  expect(await ringOf(page, 'Mossback')).toBeGreaterThan(1);
  expect(await ringOf(page, 'Sunny')).toBe(0);

  await ev(page, '__closeFestival');
  const bondsAfter = await ev<Record<string, number>>(page, '__bonds');
  const twitchRing = Object.keys(bondsAfter).filter(
    (k) => k.split('|').includes('Twitch') && (bondsAfter[k] ?? 0) >= (bondsMid[k] ?? 0) + 10 - 1e-6,
  );
  expect(twitchRing, 'Twitch stood beside someone in the ring').toHaveLength(1);
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem.Mossback).toContain('the spring festival — Sunny came for me; I stayed out');
  expect(mem.Sunny).toContain('the spring festival — brought Twitch in from the edge');
  const tales = await ev<Record<string, { fetchedBy?: string; refused?: boolean; foe?: string }>>(page, '__festivalTales');
  expect(tales.Twitch).toMatchObject({ fetchedBy: 'Sunny' });
  expect(tales.Twitch.foe).toBeUndefined();
  expect(tales.Mossback).toMatchObject({ refused: true, foe: 'Twitch' });
  const greet = await ev<string>(page, '__pickTone', 'Sunny', 'warm');
  expect(greet).toContain('Twitch came in from the edge, too.');
  // the founding feud is untouched: being fetched in is not a truce
  expect((await ev<Record<string, number>>(page, '__grudges'))['Mossback|Twitch']).toBeGreaterThanOrEqual(grudgeBefore - 1);
});

test('the keeper standing in the ring is welcomed and remembered (BACKLOG-600)', async ({ page }) => {
  const f = await openSpring(page, [17, 12]);
  expect(await ev(page, '__festivalKeeper')).toBe(false);
  await ev(page, '__stepWorld');
  expect(await ev(page, '__festivalKeeper')).toBe(false);
  const before = await ev<Record<string, number>>(page, '__friendship');
  await placeKeeper(page, 8, 5);
  await ev(page, '__stepWorld');
  expect(await ev(page, '__festivalKeeper')).toBe(true);
  await ev(page, '__stepWorld');
  const after = await ev<Record<string, number>>(page, '__friendship');
  for (const name of f.attendees) expect(after[name] ?? 0, name).toBe(Math.min(100, (before[name] ?? 0) + 3));
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker.filter((l) => l.startsWith('🌸 Sunny: The keeper came too!'))).toHaveLength(1);
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  for (const name of f.attendees) expect(mem[name], name).toContain('the spring festival — the keeper came');
  await ev(page, '__closeFestival');
  expect(await ev<string>(page, '__pickTone', 'Sunny', 'warm')).toContain('You were there too!');
});

test('a keeper who missed the festival hears it (BACKLOG-600)', async ({ page }) => {
  await openSpring(page, [17, 12]);
  for (let i = 0; i < 4; i++) await ev(page, '__stepWorld');
  expect(await ev(page, '__festivalKeeper')).toBe(false);
  await ev(page, '__closeFestival');
  const tales = await ev<Record<string, { keeper?: boolean }>>(page, '__festivalTales');
  expect(Object.values(tales).every((t) => t.keeper === false)).toBe(true);
  expect(await ev<string>(page, '__pickTone', 'Sunny', 'warm')).toContain('You missed it — come next season?');
});
