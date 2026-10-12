import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 29, cycle 185. BACKLOG-599: each guest trades its home ground's goods with the bowl at the pond, and a
 * basket stands there while it lasts. BACKLOG-180: circle members who stood side by side gain the ring bond, and a
 * pair that crosses the friend floor walks away friends and says so. Founding bonds, piles and feud intact.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

type Pile = Record<string, number>;
const ZONES = ['bowl', 'grove', 'fernreach', 'hollow', 'ridge'];

async function piles(page: Page): Promise<Record<string, Pile>> {
  const out: Record<string, Pile> = {};
  for (const z of ZONES) out[z] = await ev<Pile>(page, '__zoneStockpile', z);
  return out;
}
const total = (ps: Record<string, Pile>, kind: string) => Object.values(ps).reduce((n, p) => n + (p[kind] ?? 0), 0);

async function openSpring(page: Page) {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, 10, 0);
}

test('the guests trade their grounds’ goods at the pond, and a basket stands there (BACKLOG-599)', async ({ page }) => {
  await openSpring(page);
  const before = await piles(page);
  const f = await ev<{ attendees: string[] } | null>(page, '__checkFestival');
  expect(f).not.toBeNull();
  const fair = await ev<{ name: string; home: string; gave: string | null; took: string | null }[]>(page, '__festivalFair');
  expect(fair.length).toBeGreaterThan(0);
  const after = await piles(page);
  expect(after).not.toEqual(before);
  for (const kind of ['branch', 'stone', 'frond', 'obsidian']) expect(total(after, kind)).toBe(total(before, kind));
  // one trade per ground: the grove's second guest does not swap back what its first just traded
  expect(new Set(fair.map((t) => t.home)).size).toBe(fair.length);
  expect(fair.find((t) => t.home === 'grove')).toMatchObject({ name: 'Bramble', gave: 'stone', took: 'branch' });
  expect(fair.find((t) => t.home === 'ridge')).toMatchObject({ name: 'Ember', gave: 'stone' });
  expect(after.ridge.stone ?? 0).toBe((before.ridge.stone ?? 0) - 1);
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker).toContain('🧺 Bramble brought 🪨 from The Grove and took 🪵 home');
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem.Bramble).toContain('the spring festival fair — brought 🪨, took 🪵');
  expect(await ev(page, '__festivalBasket')).toEqual({ tileX: 7, tileY: 3 });
  await ev(page, '__closeFestival');
  expect(await ev(page, '__festivalBasket')).toBeNull();
});

test('dinos who stood side by side in the ring walk away friends, and say so (BACKLOG-180)', async ({ page }) => {
  await openSpring(page);
  await ev(page, '__checkFestival');
  const before = await ev<Record<string, number>>(page, '__bonds');
  for (let i = 0; i < 25; i++) await ev(page, '__stepWorld');
  await ev(page, '__closeFestival');
  const after = await ev<Record<string, number>>(page, '__bonds');
  const gained = Object.keys(after).filter((k) => (after[k] ?? 0) >= (before[k] ?? 0) + 10 - 1e-9);
  expect(gained.length).toBeGreaterThan(0);

  const friends = await ev<[string, string][]>(page, '__festivalFriends');
  expect(friends.length).toBeGreaterThan(0);
  const [a, b] = friends[0];
  expect(after[[a, b].sort().join('|')]).toBeGreaterThanOrEqual(8);
  expect(before[[a, b].sort().join('|')] ?? 0).toBeLessThan(8);
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem[a].some((m) => m.startsWith('the spring festival — stood beside'))).toBe(true);
  expect((await ev<string[]>(page, '__ticker')).some((l) => l.startsWith('🌱 ') && l.includes('stood together in the ring'))).toBe(true);
  const tales = await ev<Record<string, { friend?: string }>>(page, '__festivalTales');
  expect(tales[a].friend).toBeTruthy();
  const home = await ev<Record<string, string>>(page, '__saveZones');
  const pair = friends.find(([x, y]) => (home[x] ?? 'bowl') === 'bowl' || (home[y] ?? 'bowl') === 'bowl');
  expect(pair, 'a new friendship with a bowl resident in it').toBeTruthy();
  const speaker = (home[pair![0]] ?? 'bowl') === 'bowl' ? pair![0] : pair![1];
  const greet = await ev<string>(page, '__pickTone', speaker, 'warm');
  expect(greet).toContain(tales[speaker].friend!);
  expect(await ev<Record<string, string[]>>(page, '__memory').then((m) => m.Mossback.some((x) => x.includes('stood beside')))).toBe(false);
});
