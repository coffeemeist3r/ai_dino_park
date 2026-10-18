import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 31, cycle 190. BACKLOG-609: a youngster holds no standing — the Grove's seat is Bramble's while Pip is
 * young, and Pip takes it at the molt. BACKLOG-313: the grown dino keeps its guardian's habit, now and then.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

test('the Grove seat is Bramble’s until Pip grows up, then Pip takes it (BACKLOG-609)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect((await ev<Record<string, string[]>>(page, '__councils')).grove).toEqual(['Bramble']);
  await ev(page, '__moltNow', 'Pip');
  expect((await ev<Record<string, string[]>>(page, '__councils')).grove).toEqual(['Pip']);
  expect(await ev<string[]>(page, '__ticker')).toContain("🗳️ Pip takes a seat on the Grove's council — grown now");
});

test('grown Pip still does Bramble’s quirk now and then, and keeps it across a reload (BACKLOG-313)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setZone', 'grove');
  await ev(page, '__advanceMinutes', 5 * 60 + 1); // Pip wakes at 13:00, still young
  const bramble = await ev<{ glyph: string; label: string }>(page, '__fidget', 'Bramble');
  await ev(page, '__moltNow', 'Pip');
  const kept = (await ev<Record<string, { kept?: { from: string; glyph: string } }>>(page, '__growth')).Pip.kept;
  expect(kept).toEqual({ from: 'Bramble', glyph: bramble.glyph, label: bramble.label });
  const own = await ev<{ glyph: string; label: string }>(page, '__fidget', 'Pip');
  expect(own.glyph).not.toBe(bramble.glyph);
  const row = (await ev<Array<{ name: string; quirk: string }>>(page, '__bookRows')).find((r) => r.name === 'Pip')!;
  expect(row.quirk).toContain("and still Bramble's");

  // Past the molt's 8s flourish window, the idle mark alternates between its own quirk and the kept one.
  await expect.poll(() => ev(page, '__lifted', 'Pip'), { timeout: 15_000 }).toBe(false);
  const seen = new Set<string>();
  for (let i = 0; i < 40 && seen.size < 2; i++) {
    await ev(page, '__stepWorld');
    if ((await ev(page, '__activity', 'Pip')) !== 'wandering') continue;
    const m = await ev<string>(page, '__activityMark', 'Pip');
    if (m === own.glyph || m === bramble.glyph) seen.add(m);
  }
  expect([...seen].sort()).toEqual([own.glyph, bramble.glyph].sort());

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  // loadFromDb resolves a beat after __ready, so poll the restored record rather than read it once.
  await expect
    .poll(() => page.evaluate(() => ((window as W).__growth?.() as Record<string, { kept?: { from: string } }> | undefined)?.Pip?.kept?.from ?? null), { timeout: 30_000 })
    .toBe('Bramble');
});
