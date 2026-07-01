import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Solitary tic (BACKLOG-405). A dino left truly alone — no company in its zone, no pressing need, nothing to
 * do — falls into a small personal ritual after a solitary stretch, filing a one-time "a little ritual of
 * your own" memory. A dino kept beside company never invents one.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const tic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);
const memory = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);

test('a dino alone with nothing pressing invents its tic; one with company never does', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const [c1, c2] = [roster[1], roster[2]];

  // Isolate the target in the bowl: send everyone else to the grove, drop the target mid-bowl, and quiet its
  // gathering (curiosity 0 → never fetches) so nothing but wandering competes with the ritual.
  await page.evaluate(
    ({ others }) => {
      const w = window as W;
      for (const n of others) w.__migrate(n, 'grove');
    },
    { others: roster.slice(1) },
  );
  await page.evaluate((n) => {
    const w = window as W;
    w.__placeDino(n, 10, 7);
    w.__setTrait(n, 'curiosity', 0);
  }, alone);

  // Step the world; keep the target's needs quiet so solitude (not hunger) is what it experiences, and keep
  // the two exiles standing together in the grove each step (company within range → neither can ever tic).
  let invented = false;
  for (let i = 0; i < 100 && !invented; i++) {
    await page.evaluate(
      ({ n, a, b }) => {
        const w = window as W;
        w.__setNeed(n, 'hunger', 0);
        w.__setNeed(n, 'thirst', 0);
        w.__placeDino(a, 5, 5);
        w.__placeDino(b, 6, 5);
      },
      { n: alone, a: c1, b: c2 },
    );
    await page.evaluate(() => (window as W).__stepWorld());
    invented = (await tic(page, alone)).invented;
  }

  expect(invented).toBe(true);
  const t = await tic(page, alone);
  expect(['pace', 'fuss', 'circle']).toContain(t.tic.kind);
  const mem = await memory(page, alone);
  expect(mem.some((m) => m.includes('a little ritual of your own'))).toBe(true);

  // The companioned pair never invented a tic — company breaks the solitude.
  expect((await tic(page, c1)).invented).toBe(false);
  expect((await tic(page, c2)).invented).toBe(false);

  expect(errors).toEqual([]);
});
