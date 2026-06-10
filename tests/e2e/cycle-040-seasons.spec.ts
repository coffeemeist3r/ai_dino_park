import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-159 — the turning year. The season derives from the persisted clock day (no save
// change), so the whole flow is stageable headless: set the clock to a boundary eve, advance
// two in-game minutes across midnight, and the year turns — live-observed, exactly once.

type W = Record<string, unknown>;

const season = (p: Page) => p.evaluate(() => ((window as W).__season as () => string)());
const turns = (p: Page) => p.evaluate(() => ((window as W).__seasonTurns as () => number)());
const tint = (p: Page) =>
  p.evaluate(() => ((window as W).__seasonTint as () => { color: number; alpha: number })());
const hud = (p: Page) => p.evaluate(() => ((window as W).__clockHudText as () => string)());
const setClock = (p: Page, d: number, h: number, m: number) =>
  p.evaluate(({ d, h, m }) => ((window as W).__setClock as (a: number, b: number, c: number) => unknown)(d, h, m), { d, h, m });
const advanceWall = (p: Page, ms: number) =>
  p.evaluate((x) => ((window as W).__advanceWall as (n: number) => unknown)(x), ms);

test('a fresh boot is spring, in the HUD and the hooks — and boot is not a turn', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await season(page)).toBe('spring');
  expect(await hud(page)).toContain('spring');
  expect(await turns(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('crossing day 7 → 8 turns the year to summer, exactly once, with banner + ticker + memory', async ({ page }) => {
  await boot(page);

  await setClock(page, 7, 23, 59);
  expect(await turns(page)).toBe(0); // staging the clock is a restore-like sync, never a beat
  expect(await season(page)).toBe('spring');

  await advanceWall(page, 120_000); // two in-game minutes at the default 1× scale — over midnight

  expect(await season(page)).toBe('summer');
  expect(await hud(page)).toContain('summer');
  expect(await turns(page)).toBe(1);

  const events = await page.evaluate(() => ((window as W).__events as () => string[])());
  expect(events.some((e) => e.includes('season turns') && e.includes('summer'))).toBe(true);

  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect((memory.Rex ?? []).some((m) => m === 'the season turned to summer')).toBe(true);
});

test('the seasonal wash is subtle and actually changes color on a turn', async ({ page }) => {
  await boot(page);

  const spring = await tint(page);
  expect(spring.alpha).toBeLessThanOrEqual(0.12);

  await setClock(page, 21, 23, 59);
  await advanceWall(page, 120_000); // day 22 — winter

  const winter = await tint(page);
  expect(winter.alpha).toBeLessThanOrEqual(0.12);
  expect(winter.color).not.toBe(spring.color);
  expect(await season(page)).toBe('winter');
});

test('a save restore re-derives the season without firing a turn', async ({ page }) => {
  await boot(page);

  await setClock(page, 10, 12, 0); // mid-summer
  await page.evaluate(() => ((window as W).__saveNow as () => Promise<unknown>)());

  await page.reload();
  await boot(page);

  expect(await season(page)).toBe('summer');
  expect(await hud(page)).toContain('summer');
  expect(await turns(page)).toBe(0); // restore synced, never beat
});
