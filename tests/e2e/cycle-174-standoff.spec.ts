import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * BACKLOG-024 — rivals square off. Two dinos the grudge graph calls rivals who bump on one ground stop and
 * bristle; the less bold one backs two tiles away, and the ticker and both books keep it.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);
const ticker = (p: Page) => ev<string[]>(p, '__events');
const tileOf = async (p: Page, name: string) => {
  const d = (await ev<Array<{ name: string; x: number; y: number }>>(p, '__dinoPositions')).find((x) => x.name === name)!;
  return { x: Math.floor(d.x / 32), y: Math.floor(d.y / 32) };
};

async function founded(page: Page): Promise<void> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await expect.poll(async () => Object.keys(await ev<object>(page, '__grudges'))).toEqual(['Mossback|Twitch']);
}

test('the founding rivals square off on their own, inside ten minutes of watching', async ({ page }) => {
  await founded(page);
  // Nudged near each other to keep the spec short — everything after this is ordinary ambient steps.
  await ev(page, '__placeDino', 'Mossback', 6, 6);
  await ev(page, '__placeDino', 'Twitch', 9, 6);
  for (let i = 0; i < 200 && !(await ev(page, '__lastStandoff')); i++) await ev(page, '__stepWorld');
  const s = await ev<{ holder: string; yielder: string } | null>(page, '__lastStandoff');
  expect(s).not.toBeNull();
  expect([s!.holder, s!.yielder].sort()).toEqual(['Mossback', 'Twitch']);
  expect((await ticker(page)).some((l) => l.startsWith('💢') && l.includes('Mossback') && l.includes('Twitch'))).toBe(true);
});

test('the yielder backs off two tiles, and both books keep it', async ({ page }) => {
  await founded(page);
  await ev(page, '__placeDino', 'Mossback', 8, 7);
  const s = await ev<{ holder: string; yielder: string }>(page, '__forceStandoff', 'Mossback', 'Twitch');
  expect(s).not.toBeNull();
  const h = await tileOf(page, s.holder);
  const y = await tileOf(page, s.yielder);
  expect(Math.max(Math.abs(h.x - y.x), Math.abs(h.y - y.y))).toBeGreaterThanOrEqual(2);
  expect(await ticker(page)).toContain(`💢 ${s.holder} and ${s.yielder} squared off — ${s.yielder} backed down`);
  const mem = await ev<Record<string, string[]>>(page, '__memory');
  expect(mem[s.holder]).toContain(`you stared down ${s.yielder}`);
  expect(mem[s.yielder]).toContain(`${s.holder} stared you down — you backed off`);
});

test('a pair under the bar meets as before and never squares off', async ({ page }) => {
  await founded(page);
  await page.evaluate(() => { (window as W).__placeDino('Rex', 4, 4); (window as W).__placeDino('Sunny', 5, 4); });
  for (let i = 0; i < 5; i++) await ev(page, '__stepWorld');
  expect(((await ticker(page)) as string[]).some((l) => l.startsWith('💢') && l.includes('Rex'))).toBe(false);
});
