import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 33, cycle 193. BACKLOG-618: two grown dinos who are each other's closest friend pair up when they meet;
 * a one-sided courtship is turned down. BACKLOG-620: the pair is in the save, and a pair keeps company on idle steps.
 */

type W = Record<string, any>;
type Pairs = Record<string, { mate: string; day: number }>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const PAIRED = /^💕 (Mossback|Glade) courts (Mossback|Glade) with (a fern|a song)\. (Mossback|Glade) says yes\.$/;

async function start(page: Page): Promise<void> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, 9, 0);
}

test('Mossback and Glade meet and pair up, and the book says so (BACKLOG-618)', async ({ page }) => {
  await start(page);
  await ev(page, '__forceConverse', 'Mossback', 'Glade');
  const pairs = await ev<Pairs>(page, '__pairs');
  expect(pairs.Mossback).toEqual({ mate: 'Glade', day: 1 });
  expect(pairs.Glade).toEqual({ mate: 'Mossback', day: 1 });

  const ticker = await ev<string[]>(page, '__ticker');
  const lines = ticker.filter((l) => PAIRED.test(l));
  expect(lines).toHaveLength(1);
  const [, courter, courted, gift] = PAIRED.exec(lines[0])!;
  expect(courter).not.toBe(courted);
  expect(gift).toBe(courter === 'Mossback' ? 'a fern' : 'a song');
  const memory = await ev<Record<string, string[]>>(page, '__memory');
  expect(memory[courter]).toContain(`I courted ${courted} with ${gift}, and ${courted} said yes`);
  expect(memory[courted]).toContain(`${courter} courted me with ${gift}, and I said yes`);
  const rows = await ev<Array<{ name: string; mate?: string }>>(page, '__bookRows');
  expect(rows.find((r) => r.name === 'Mossback')?.mate).toBe('💕 sweet on Glade (since day 1)');
  expect(rows.find((r) => r.name === 'Glade')?.mate).toBe('💕 sweet on Mossback (since day 1)');

  // Paired once: a second meeting changes nothing.
  await ev(page, '__forceConverse', 'Glade', 'Mossback');
  expect((await ev<string[]>(page, '__ticker')).filter((l) => PAIRED.test(l))).toHaveLength(1);

  // BACKLOG-620: the pair survives a reload.
  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => ((window as W).__pairs?.() as Pairs | undefined)?.Glade ?? null), { timeout: 30_000 })
    .toEqual({ mate: 'Mossback', day: 1 });
});

test('Ember courts Sunny and is turned down gently, and waits a day (BACKLOG-618)', async ({ page }) => {
  await start(page);
  await ev(page, '__bondPair', 'Ember', 'Sunny', 7); // 18 → 25; Sunny's closest is still Rex (30)
  await ev(page, '__court', 'Ember', 'Sunny');
  expect(await ev<Pairs>(page, '__pairs')).toEqual({});
  const declined = "💔 Ember courts Sunny with a warm spot in the sun. Sunny turns Ember down gently.";
  expect((await ev<string[]>(page, '__ticker')).filter((l) => l === declined)).toHaveLength(1);
  await ev(page, '__court', 'Sunny', 'Ember');
  expect((await ev<string[]>(page, '__ticker')).filter((l) => l === declined)).toHaveLength(1);
});

test('Pip is too young to court until it grows up at 14:00 (BACKLOG-618)', async ({ page }) => {
  await start(page);
  expect(await ev(page, '__court', 'Bramble', 'Pip')).toEqual({});
  await ev(page, '__setClock', 1, 14, 30);
  expect(await ev(page, '__stageOf', 'Pip')).toBe('adult');
  const pairs = await ev<Pairs>(page, '__court', 'Bramble', 'Pip');
  expect(pairs.Pip?.mate).toBe('Bramble');
});

test('a pair keeps company on idle steps (BACKLOG-620)', async ({ page }) => {
  await start(page);
  await ev(page, '__court', 'Mossback', 'Glade');
  await ev(page, '__placeDino', 'Mossback', 4, 6);
  await ev(page, '__placeDino', 'Glade', 12, 6);
  const gap = async (): Promise<number> => {
    const pos = await ev<Array<{ name: string; x: number; y: number }>>(page, '__dinoPositions');
    const [a, b] = ['Mossback', 'Glade'].map((n) => pos.find((p) => p.name === n)!);
    return Math.round(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) / 32); // TILE
  };
  expect(await gap()).toBe(8);
  let closed = -1;
  for (let i = 0; i < 20; i++) {
    await ev(page, '__stepWorld');
    if ((await gap()) <= 3) { closed = i; break; }
  }
  expect(closed).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < 20; i++) {
    await ev(page, '__stepWorld');
    expect(await gap()).toBeLessThanOrEqual(3);
  }
});
