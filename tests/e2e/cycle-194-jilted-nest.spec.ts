import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 33, cycle 194. BACKLOG-621: when a pair forms, whoever loved one of them best takes it in its own temper.
 * BACKLOG-622: a pair keeps a nest, sleeps there side by side, and lays its egg there without the 60-bond bar.
 */

type W = Record<string, any>;
type Nest = { zone: string; tileX: number; tileY: number };
type Pairs = Record<string, { mate: string; day: number; nest?: Nest }>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);
const TILE = 32;

async function start(page: Page, hour = 9): Promise<void> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__setClock', 1, hour, 0);
}

test('Rex and Sunny pair, and Ember, who loved Sunny best, is glad for them (BACKLOG-621)', async ({ page }) => {
  await start(page);
  await ev(page, '__court', 'Rex', 'Sunny');
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker).toContain('🥲 Ember is glad for Sunny and Rex');
  const memory = await ev<Record<string, string[]>>(page, '__memory');
  expect(memory.Ember).toContain("Sunny paired off with Rex. I'm glad for them");
  expect((await ev<Array<{ name: string }>>(page, '__funks')).map((f) => f.name)).not.toContain('Ember');
});

test('Mossback and Glade pair: Murk is jealous of Mossback, Thornback is glad (BACKLOG-621)', async ({ page }) => {
  await start(page);
  await ev(page, '__court', 'Mossback', 'Glade');
  const ticker = await ev<string[]>(page, '__ticker');
  expect(ticker).toContain('😒 Murk watches Glade pair off with Mossback, and sulks');
  expect(ticker).toContain('🥲 Thornback is glad for Mossback and Glade');
  const memory = await ev<Record<string, string[]>>(page, '__memory');
  expect(memory.Murk).toContain('Glade paired off with Mossback. Mossback took my friend');
  const funks = await ev<Array<{ name: string; kind: string }>>(page, '__funks');
  expect(funks).toContainEqual(expect.objectContaining({ name: 'Murk', kind: 'jilted' }));
  const rows = await ev<Array<{ name: string; rival?: string }>>(page, '__bookRows');
  expect(rows.find((r) => r.name === 'Murk')?.rival).toContain('Mossback');
});

test('a pair gets a nest, sleeps at it side by side, lays its egg there, and keeps it over a reload (BACKLOG-622)', async ({ page }) => {
  await start(page, 23);
  await ev(page, '__placeDino', 'Mossback', 4, 6);
  await ev(page, '__placeDino', 'Glade', 12, 6);
  await ev(page, '__court', 'Mossback', 'Glade');
  const pairs = await ev<Pairs>(page, '__pairs');
  const nest = pairs.Mossback.nest!;
  expect(nest.zone).toBe('bowl');
  expect(pairs.Glade.nest).toEqual(nest);
  const nests = await ev<Array<{ pair: string; x: number; y: number; visible: boolean }>>(page, '__nests');
  expect(nests).toHaveLength(1);
  expect(nests[0]).toMatchObject({ x: nest.tileX * TILE + TILE / 2, y: nest.tileY * TILE + TILE / 2, visible: true });

  // Both are day dinos asleep at 23:00: Glade (first by name) lies on the nest, Mossback beside it.
  const berths: Record<string, { x: number; y: number }> = {
    Glade: { x: nest.tileX, y: nest.tileY },
    Mossback: { x: nest.tileX + 1 < 20 ? nest.tileX + 1 : nest.tileX - 1, y: nest.tileY },
  };
  const atBerths = async (): Promise<boolean> => {
    const pos = await ev<Array<{ name: string; x: number; y: number }>>(page, '__dinoPositions');
    return ['Glade', 'Mossback'].every((n) => {
      const p = pos.find((q) => q.name === n)!;
      return Math.round((p.x - TILE / 2) / TILE) === berths[n].x && Math.round((p.y - TILE / 2) / TILE) === berths[n].y;
    });
  };
  let arrived = false;
  for (let i = 0; i < 20 && !arrived; i++) {
    await ev(page, '__stepWorld');
    arrived = await atBerths();
  }
  expect(arrived).toBe(true);
  for (let i = 0; i < 3 && !(await ev<unknown[]>(page, '__eggs')).length; i++) await ev(page, '__stepWorld');
  const eggs = await ev<Array<{ parentA: string; parentB: string; tileX: number; tileY: number }>>(page, '__eggs');
  expect(eggs[0]).toMatchObject({ tileX: nest.tileX, tileY: nest.tileY });
  expect(await ev<number>(page, '__bond', 'Mossback', 'Glade')).toBeLessThan(60);
  expect(await ev<string[]>(page, '__ticker')).toContain('🥚 Glade & Mossback laid an egg in their nest');

  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => ((window as W).__nests?.() as unknown[] | undefined)?.length ?? 0), { timeout: 30_000 }).toBe(1);
});
