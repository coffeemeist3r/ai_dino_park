import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * BACKLOG-136 — comfort is for friends.
 *
 * The dino that loses the scramble at the hatch (544) is the sulk a player causes in the first minute, and
 * until tonight nobody ever came for it. Now a friend the book would call *close* walks over from the same
 * ground and talks it round; a dino whose best bond is only friendly stands there alone, and the ticker
 * names who did not come. Staged through `__forceContest`, the production resolution.
 */

type W = Record<string, unknown>;
type Consoler = { friend: string; loser: string; steps: number } | null;

const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const consoler = (p: Page) => ev<Consoler>(p, '__consoler');
const ticker = (p: Page) => ev<string[]>(p, '__events');
const funkNames = async (p: Page) => (await ev<Array<{ name: string }>>(p, '__funks')).map((f) => f.name);
const memoryOf = async (p: Page, n: string) => (await ev<Record<string, string[]>>(p, '__memory'))[n] ?? [];

/** Glade loses a contest to a bold Sunny. */
async function gladeLoses(page: Page): Promise<void> {
  await ev(page, '__dropFood', undefined, 'fish');
  await ev(page, '__setTrait', 'Sunny', 'bravery', 1);
  await ev(page, '__forceContest', 'Sunny', 'Glade');
}

async function stageCloseFriend(page: Page): Promise<void> {
  await boot(page);
  await foundingState(page, 'strangers');
  await foundingState(page, 'all-bowl');
  await ev(page, '__bondPair', 'Rex', 'Glade', 30);
  await ev(page, '__placeDino', 'Glade', 5, 5);
  await ev(page, '__placeDino', 'Rex', 10, 5);
  await gladeLoses(page);
}

test('a close friend walks over and talks the sore dino round (BACKLOG-136)', async ({ page }) => {
  await stageCloseFriend(page);
  expect(await consoler(page)).toMatchObject({ friend: 'Rex', loser: 'Glade' });
  expect(await ticker(page)).toContain('🫂 Rex is heading over to Glade');
  const before = (await ev<Record<string, number>>(page, '__bonds'))['Glade|Rex'];

  for (let i = 0; i < 16 && (await consoler(page)); i++) await ev(page, '__stepWorld');

  expect(await consoler(page)).toBeNull();
  expect(await ev(page, '__lastComfort')).toEqual({ comforter: 'Rex', sulker: 'Glade' });
  expect(await funkNames(page)).not.toContain('Glade'); // well inside its twenty-step window
  expect((await memoryOf(page, 'Glade')).some((m) => m.includes('Rex came over to comfort me'))).toBe(true);
  expect((await ticker(page)).some((l) => l.includes('Rex talked Glade round'))).toBe(true);
  expect((await ev<Record<string, number>>(page, '__bonds'))['Glade|Rex']).toBeGreaterThan(before);
});

test('on the founding graph a merely friendly dino does not come, and the ticker says who (BACKLOG-136)', async ({
  page,
}) => {
  await boot(page);
  await foundingState(page, 'all-bowl'); // founding bonds intact: Glade's best is Mossback at 24 — friendly, not close
  await gladeLoses(page);
  expect(await consoler(page)).toBeNull();
  expect(await ticker(page)).toContain("🫥 nobody came for Glade — Mossback isn't close enough");
  expect(await funkNames(page)).toContain('Glade');
});

test('the keeper getting there first ends the funk and the errand together (BACKLOG-136/544)', async ({ page }) => {
  await stageCloseFriend(page);
  await ev(page, '__stepWorld');
  await ev(page, '__greet', 'Glade');
  expect(await consoler(page)).toBeNull();
  expect(await funkNames(page)).not.toContain('Glade');
  const mem = await memoryOf(page, 'Glade');
  expect(mem.some((m) => m.includes('keeper came over'))).toBe(true);
  expect(mem.some((m) => m.includes('came over to comfort me'))).toBe(false);
});
