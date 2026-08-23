import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ritual drifts (BACKLOG-421).
 *
 * Before this cycle, a dino's tic anchored wherever the wander had dropped it and `resetTic` threw the
 * anchor away, so six stretches on one ground happened in six unrelated places — the ritual had no memory
 * of where it was performed. Now it has a **haunt**: a worn tile it comes back to, one step further along
 * each time. These specs prove the second stretch is not the first, and that a dino who has wandered clear
 * across the ground starts a new habit rather than trekking back to the old one.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const place = (p: Page, n: string, x: number, y: number) =>
  p.evaluate(([nn, xx, yy]) => (window as W).__placeDino(nn, xx, yy), [n, x, y] as const);
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const resetTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__resetTic(nn), n);
const haunt = (p: Page, n: string) =>
  p.evaluate(
    (nn) =>
      (window as W).__ticHaunt(nn) as {
        zone: string;
        haunt: { tileX: number; tileY: number; drifts: number } | null;
        anchor: { tileX: number; tileY: number } | null;
      },
    n,
  );

const cheb = (a: { tileX: number; tileY: number }, b: { tileX: number; tileY: number }) =>
  Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY));

test('the second stretch is not the first — the little path has moved one tile', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [who] = await names(page);
  await place(page, who, 9, 6);
  await inventTic(page, who);

  const first = await haunt(page, who);
  // The first stretch on a ground lays the haunt underfoot — the pre-421 behaviour, unchanged.
  expect(first.haunt).toEqual({ tileX: 9, tileY: 6, drifts: 0 });
  expect(first.anchor).toEqual({ tileX: 9, tileY: 6 });

  // Company or a need ends the stretch; the anchor goes with it and the haunt deliberately does not.
  await resetTic(page, who);
  expect((await haunt(page, who)).anchor).toBeNull();
  expect((await haunt(page, who)).haunt).toEqual({ tileX: 9, tileY: 6, drifts: 0 });

  await place(page, who, 10, 6);
  await inventTic(page, who);
  const second = await haunt(page, who);

  expect(second.anchor).not.toEqual(first.anchor);
  expect(cheb(second.anchor!, first.anchor!)).toBe(1);
  expect(second.haunt!.drifts).toBe(1);
  // ...and it is the *habit* it drifted from, not the tile the dino happened to be standing on.
  expect(second.anchor).toEqual({ tileX: second.haunt!.tileX, tileY: second.haunt!.tileY });

  expect(errors).toEqual([]);
});

test('a habit wandered away from is lost, not trekked back to', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [who] = await names(page);
  await place(page, who, 2, 2);
  await inventTic(page, who);
  expect((await haunt(page, who)).haunt).toEqual({ tileX: 2, tileY: 2, drifts: 0 });

  await resetTic(page, who);
  await place(page, who, 15, 12); // well beyond HAUNT_RETURN_RANGE
  await inventTic(page, who);

  const after = await haunt(page, who);
  expect(after.anchor).toEqual({ tileX: 15, tileY: 12 });
  expect(after.haunt).toEqual({ tileX: 15, tileY: 12, drifts: 0 });

  expect(errors).toEqual([]);
});

test('the path wears its way across the ground, and says so once', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [who] = await names(page);
  await place(page, who, 9, 6);

  // Six stretches on one ground. The haunt only ever drifts a tile at a time, so the dino stays well inside
  // the return range and keeps the same habit throughout.
  for (let i = 0; i < 6; i++) {
    await inventTic(page, who);
    const h = (await haunt(page, who)).haunt!;
    await resetTic(page, who);
    await place(page, who, h.tileX, h.tileY);
  }
  expect((await haunt(page, who)).haunt!.drifts).toBeGreaterThanOrEqual(4);

  const lines = (await page.evaluate(() => (window as W).__ticker() as string[])).filter((l) =>
    l.includes(`${who}'s little path`),
  );
  expect(lines.length).toBe(1);

  expect(errors).toEqual([]);
});

test('grief is not a habit — an aimed ritual leaves the haunt alone', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const [alone, friend] = roster;
  // 414's own setup: the dino's only real friend crosses east, so its ritual aims at the edge they left by.
  await page.evaluate(
    ({ alone, friend, rest }) => {
      const w = window as W;
      w.__bondPair(alone, friend, 50);
      w.__migrate(friend, 'grove');
      for (const n of rest) w.__migrate(n, 'grove');
    },
    { alone, friend, rest: roster.slice(2) },
  );

  await place(page, alone, 9, 6);
  await inventTic(page, alone);

  const g = await page.evaluate((nn) => (window as W).__griefTic(nn), alone);
  expect(g.grieved).toBe(friend);
  expect(g.anchor.tileX).toBeGreaterThan(9); // the east edge, not underfoot

  // ...and the ground learned nothing. The habit must survive the grief so the ritual can come back to it.
  expect((await haunt(page, alone)).haunt).toBeNull();

  expect(errors).toEqual([]);
});
