import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 28 (tentpole), cycle 183. BACKLOG-596: on the first day of a season at 10:00 the whole park gathers at
 * the bowl pond, the other grounds' residents as guests who walk home after. BACKLOG-594: the best-loved dino opens
 * it and a dino whose foe is in the circle keeps to the edge. Founding bonds and feud intact.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const TILE = 32;
const FEST = { x: 6, y: 4 };
const GUESTS = ['Bramble', 'Pip', 'Thornback', 'Murk', 'Ember'];

async function ring(page: Page): Promise<Record<string, number>> {
  const pos = await ev<{ name: string; x: number; y: number }[]>(page, '__dinoPositions');
  return Object.fromEntries(
    pos.map((p) => [p.name, Math.max(Math.abs(Math.floor(p.x / TILE) - FEST.x), Math.abs(Math.floor(p.y / TILE) - FEST.y))]),
  );
}

async function opened(page: Page) {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, 9, 0);
  expect(await ev(page, '__checkFestival')).toBeNull();
  await ev(page, '__setClock', 1, 10, 0);
  return ev<{ season: string; attendees: string[]; guests: string[]; leader: string; sulkers: Record<string, string> }>(page, '__checkFestival');
}

test('spring day 1 at 10:00 the whole park gathers at the bowl pond (BACKLOG-596)', async ({ page }) => {
  const f = await opened(page);
  expect(f.season).toBe('spring');
  expect(f.attendees).toHaveLength(10);
  expect([...f.guests].sort()).toEqual([...GUESTS].sort());
  for (const g of GUESTS) expect(await ev(page, '__homeZone', g)).toBe('bowl');
  const saved = await ev<Record<string, string>>(page, '__saveZones');
  expect(saved.Pip).toBe('grove');
  expect(saved.Ember).toBe('ridge');
  expect(await ev(page, '__festivalSeason')).toBe(0);

  for (let i = 0; i < 24; i++) await ev(page, '__stepWorld');
  const r = await ring(page);
  for (const name of f.attendees) expect(r[name], name).toBeLessThanOrEqual(3);
});

test('Sunny opens it; Mossback and Twitch keep to the edge (BACKLOG-594)', async ({ page }) => {
  const f = await opened(page);
  expect(f.leader).toBe('Sunny');
  expect(f.sulkers).toEqual({ Mossback: 'Twitch', Twitch: 'Mossback' });
  for (let i = 0; i < 24; i++) await ev(page, '__stepWorld');
  const r = await ring(page);
  expect(r.Sunny).toBe(0);
  expect(r.Rex).toBeLessThanOrEqual(1);
  for (const s of ['Mossback', 'Twitch']) {
    expect(r[s], s).toBeGreaterThan(1);
    expect(r[s], s).toBeLessThanOrEqual(3);
  }
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem.Sunny).toContain('opened the spring festival at the bowl pond');
  expect(mem.Mossback).toContain('the spring festival — kept to the edge; Twitch was there');
  expect(mem.Rex).toContain('the spring festival at the bowl pond — Sunny opened it');
});

test('when it closes the guests walk home, and the season does not hold a second (BACKLOG-596)', async ({ page }) => {
  await opened(page);
  await ev(page, '__closeFestival');
  for (let i = 0; i < 30 && (await ev(page, '__festival')); i++) await ev(page, '__stepWorld');
  expect(await ev(page, '__festival')).toBeNull();
  expect(await ev(page, '__homeZone', 'Pip')).toBe('grove');
  expect(await ev(page, '__homeZone', 'Ember')).toBe('ridge');
  expect(await ev(page, '__homeZone', 'Murk')).toBe('hollow');
  expect(await ev(page, '__checkFestival')).toBeNull();
});

test('the live calendar opens it on its own when the clock reaches 10:00 (BACKLOG-596)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, 9, 59);
  await ev(page, '__resumeAmbient');
  await expect.poll(() => ev(page, '__festival'), { timeout: 20_000 }).not.toBeNull();
  await ev(page, '__pauseAmbient');
});
