import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Solitary tic (BACKLOG-405). A dino left truly alone — no company in its zone, no pressing need, nothing to
 * do — falls into a small personal ritual after a solitary stretch, filing a one-time "a little ritual of
 * your own" memory. A dino kept beside company never invents one.
 *
 * The whole cast is pinned each step: the lone dino to one bowl tile, everyone else to a tight grove cluster
 * (company for each other, so none of them tics) that never shares the lone dino's tile — so it forms no
 * cross-zone bond (meets key on pixel proximity, not zone) and its ritual stays a plain 405 one, not the
 * grief-aimed variant a departed friend would trigger (BACKLOG-414).
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
  const others = roster.slice(1);

  // Send everyone else to the grove and quiet the target's gathering (curiosity 0 → never fetches).
  await page.evaluate(
    ({ others, alone }) => {
      const w = window as W;
      for (const n of others) w.__migrate(n, 'grove');
      w.__setTrait(alone, 'curiosity', 0);
    },
    { others, alone },
  );

  // Each step: keep the target's needs quiet, pin it mid-bowl, and pin the exiles in a tight grove cluster
  // (company within range → neither can ever tic; never on the target's tile → no cross-zone bond).
  let invented = false;
  for (let i = 0; i < 60 && !invented; i++) {
    await page.evaluate(
      ({ alone, others }) => {
        const w = window as W;
        w.__setNeed(alone, 'hunger', 0);
        w.__setNeed(alone, 'thirst', 0);
        w.__placeDino(alone, 10, 7);
        others.forEach((n: string, idx: number) => w.__placeDino(n, 2 + idx, 2));
      },
      { alone, others },
    );
    await page.evaluate(() => (window as W).__stepWorld());
    invented = (await tic(page, alone)).invented;
  }

  expect(invented).toBe(true);
  const t = await tic(page, alone);
  expect(['pace', 'fuss', 'circle']).toContain(t.tic.kind);
  const mem = await memory(page, alone);
  expect(mem.some((m) => m.includes('a little ritual of your own'))).toBe(true);

  // The companioned cluster never invented a tic — company breaks the solitude.
  expect((await tic(page, others[0])).invented).toBe(false);
  expect((await tic(page, others[1])).invented).toBe(false);

  expect(errors).toEqual([]);
});
