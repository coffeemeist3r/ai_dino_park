import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 31, cycle 189. BACKLOG-607: a youngster's idle wander is leashed to its guardian — Pip to Bramble on a
 * fresh save. BACKLOG-320: while young it idles with its guardian's quirk, and at the molt it finds its own.
 *
 * Pip is an owl: on a fresh save it sleeps at the den until 13:00, so its waking youth is the hour before its
 * 14:00 molt — about a real minute at the default clock, five minutes into a sitting.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const TILE = 32;

test('Pip keeps to Bramble while young, and is let go at the molt (BACKLOG-607)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await ev(page, '__guardian', 'Pip')).toBe('Bramble');
  await ev(page, '__advanceMinutes', 5 * 60 + 1); // 08:00 → 13:01: Pip wakes, still young
  const tether = await ev<number>(page, '__tether');
  const G = { x: 10, y: 8 }; // Bramble pinned before each step; Pip's leash is read against that tile
  const pipDist = async () => {
    const p = (await ev<Array<{ name: string; x: number; y: number }>>(page, '__dinoPositions')).find((d) => d.name === 'Pip')!;
    return Math.max(Math.abs(Math.floor(p.x / TILE) - G.x), Math.abs(Math.floor(p.y / TILE) - G.y));
  };
  let prev = await pipDist();
  let checked = 0;
  for (let i = 0; i < 60; i++) {
    await ev(page, '__placeDino', 'Bramble', G.x, G.y);
    await ev(page, '__stepWorld');
    const d = await pipDist();
    // On the idle branch a youngster heads back when it is out past the leash and never steps beyond it.
    if ((await ev(page, '__activity', 'Pip')) === 'wandering') {
      expect(d).toBeLessThanOrEqual(Math.max(tether, prev - 1));
      if (d <= tether) checked++;
    }
    prev = d;
  }
  expect(checked).toBeGreaterThan(0);
  await ev(page, '__moltNow', 'Pip');
  expect(await ev(page, '__guardian', 'Pip')).toBeNull();
});

test('Pip idles like Bramble until it grows up, then finds its own (BACKLOG-320)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const bramble = await ev<{ glyph: string; label: string }>(page, '__fidget', 'Bramble');
  const own = await ev<{ glyph: string; label: string }>(page, '__fidget', 'Pip');
  expect(own.glyph).not.toBe(bramble.glyph);
  await ev(page, '__setZone', 'grove');
  await ev(page, '__advanceMinutes', 5 * 60 + 1); // Pip wakes at 13:00
  const pipRow = async () => (await ev<Array<{ name: string; quirk: string }>>(page, '__bookRows')).find((r) => r.name === 'Pip')!;
  expect((await pipRow()).quirk).toBe(`copies Bramble — ${bramble.label}`);
  await expect
    .poll(async () => {
      if ((await ev(page, '__activity', 'Pip')) !== 'wandering') await ev(page, '__stepWorld');
      return ev(page, '__activityMark', 'Pip');
    }, { timeout: 15_000 })
    .toBe(bramble.glyph);

  await ev(page, '__moltNow', 'Pip');
  const grown = await ev<{ label: string }>(page, '__fidget', 'Pip'); // the molt may shift which trait leads
  expect(await ev<string[]>(page, '__ticker')).toContain(`Pip stops copying Bramble — ${grown.label} now`);
  expect((await ev<Record<string, string[]>>(page, '__memory')).Pip).toContain(`you used to copy Bramble — ${bramble.label}`);
  expect(await ev(page, '__lifted', 'Pip')).toBe(true);
  expect((await pipRow()).quirk).toBe(`${grown.label}, and still Bramble's ${bramble.label} now and then`); // BACKLOG-313
});
