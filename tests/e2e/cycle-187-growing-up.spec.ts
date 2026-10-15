import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 30 (TENTPOLE), cycle 187. BACKLOG-602: the founding park ships a youngster — Pip boots young, drawn at
 * half size and piping high. BACKLOG-023: at 14:00 on day one its youth runs out and it molts — full size, a
 * temperament nudged by what its youth held (close to Bramble → softer), a line, a ticker post, a husk, a book entry.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const pipBlock = (book: string): string => {
  const lines = book.split('\n');
  const i = lines.findIndex((l) => /^▸?Pip /.test(l));
  const j = lines.findIndex((l, k) => k > i && /^▸?\S/.test(l));
  return lines.slice(i, j === -1 ? undefined : j).join('\n');
};

test('a fresh park has one youngster: Pip, small and piping (BACKLOG-602)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const names = (await ev<{ name: string }[]>(page, '__dinoPositions')).map((d) => d.name);
  for (const n of names) {
    expect(await ev(page, '__stageOf', n), n).toBe(n === 'Pip' ? 'young' : 'adult');
    expect(await ev(page, '__dinoScale', n), n).toBe(n === 'Pip' ? 0.5 : 1);
  }
  const book = await ev<string>(page, '__bookText');
  expect(pipBlock(book)).toContain('🥚 young — grows up in ~6 h');
  expect(book.split('🥚 young').length - 1).toBe(1);
});

test('at two in the afternoon Pip molts, comes out softer, and stays grown across a reload (BACKLOG-023)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const before = await ev<Record<string, number>>(page, '__traitsOf', 'Pip');
  await ev(page, '__advanceMinutes', 6 * 60 + 1); // 08:00 → 14:01, every minute ticked
  const g = (await ev<Record<string, any>>(page, '__growth')).Pip;
  expect(g.came).toBe('softer');
  expect(g.moltedDay).toBe(1);
  expect(await ev(page, '__stageOf', 'Pip')).toBe('adult');
  const after = await ev<Record<string, number>>(page, '__traitsOf', 'Pip');
  expect(after.agreeableness).toBeCloseTo(Math.min(1, before.agreeableness + 0.15), 5);
  expect(after.curiosity).toBe(before.curiosity);
  expect(await ev<string[]>(page, '__ticker')).toContain('🐚 Pip molted — came out softer');
  expect((await ev<Record<string, string[]>>(page, '__memory')).Pip).toContain('grew up — came out softer');
  expect(await ev<number>(page, '__moltHusks')).toBe(1);
  await expect.poll(() => ev<number>(page, '__dinoScale', 'Pip'), { timeout: 20_000 }).toBe(1);
  const book = await ev<string>(page, '__bookText');
  expect(pipBlock(book)).toContain('🐚 grew up on day 1 — came out softer');
  expect(book).not.toContain('🥚 young');

  await ev(page, '__saveNow');
  await page.reload();
  await page.waitForFunction(() => (window as W).__ready === true, undefined, { timeout: 30_000 });
  await expect.poll(() => ev<Record<string, any>>(page, '__growth').then((x) => x.Pip?.came), { timeout: 10_000 }).toBe('softer');
  expect(await ev(page, '__stageOf', 'Pip')).toBe('adult');
  expect(await ev(page, '__dinoScale', 'Pip')).toBe(1);
  expect((await ev<Record<string, number>>(page, '__traitsOf', 'Pip')).agreeableness).toBeCloseTo(after.agreeableness, 5);
});

test('the molt line names its friend (BACKLOG-023)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setZone', 'grove'); // the keeper walks over to Pip's ground — a bubble is spoken only in view
  await ev(page, '__moltNow', 'Pip');
  await expect.poll(() => ev<string[]>(page, '__bubbleTexts'), { timeout: 5_000 }).toContain("🐚 All grown! I'm keeping Bramble close.");
});
