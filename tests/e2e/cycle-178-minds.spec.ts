import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Milestone 26 (tentpole), cycle 178. BACKLOG-582: the mind picks whom it goes looking for. BACKLOG-583: the dusk
 * reflection, and the founding park's yesterday. Both on the as-shipped founding state — that is the point.
 */

type W = Record<string, any>;

test('a fresh park: Mossback goes looking for its rival, and Sunny remembers yesterday with Rex', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as W).__seeking('Mossback'))).toMatchObject({ name: 'Twitch', why: 'rival' });
  expect(await page.evaluate(() => (window as W).__seeking('Sunny'))).toMatchObject({ name: 'Rex', why: 'yesterday' });
  expect(await page.evaluate(() => (window as W).__reflections().Sunny)).toMatchObject({ best: 'Rex', met: 1 });
  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('seeking: Twitch (spoiling for it)');
  expect(book).toContain('yesterday: spent it with Rex');
  const ticker = await page.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
  expect(ticker).toContain('👀 Mossback goes looking for Twitch — spoiling for it.');
});

test('a socializing dino walks to the one it chose, not the one beside it', async ({ page }) => {
  await boot(page);
  const x = await page.evaluate(() => {
    const w = window as W;
    w.__seedRandom(7);
    for (const d of w.__dinoPositions()) {
      w.__setNeed(d.name, 'hunger', 0);
      w.__setNeed(d.name, 'thirst', 0);
    }
    w.__placeDino('Mossback', 2, 7);
    w.__placeDino('Glade', 3, 7); // nearest
    w.__placeDino('Twitch', 17, 7); // chosen
    w.__setTrait('Twitch', 'energy', 0); // keep the target roughly put
    w.__setIntent('Mossback', 'social');
    const start = w.__dinoPositions().find((d: { name: string }) => d.name === 'Mossback').x;
    for (let i = 0; i < 12; i++) w.__stepWorld();
    const end = w.__dinoPositions().find((d: { name: string }) => d.name === 'Mossback').x;
    w.__seedRandom(null);
    return { start, end, seeking: w.__seeking('Mossback') };
  });
  expect(x.seeking).toMatchObject({ name: 'Twitch' });
  expect(x.end - x.start).toBeGreaterThanOrEqual(4 * 16);
});

test('at dusk every dino thinks back on its day, and the park says so', async ({ page }) => {
  await boot(page);
  const day = await page.evaluate(() => (window as W).__setClock(1, 16, 58).day as number);
  await page.evaluate(() => (window as W).__advanceMinutes(3));
  const r = await page.evaluate(() => (window as W).__reflections());
  expect(Object.keys(r).length).toBeGreaterThanOrEqual(8);
  for (const v of Object.values(r) as Array<{ day: number }>) expect(v.day).toBe(day);
  const ticker = await page.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
  expect(ticker).toContain('💭 Dusk — the park thinks back on its day');
});
