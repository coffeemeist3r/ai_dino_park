import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Witnessed backbone (BACKLOG-395). The cowed spec's staging over the production `checkFeeding` path: a bold
 * winner stands against a gobbler while a friend of the winner watches from three tiles off. The friend admires it —
 * a bond nudge, a memory the gossip spine will carry, a ticker line. With no friend watching, nobody admires.
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

async function stand(page: Page, winner: string, gobbler: string, witness: string) {
  await page.evaluate(
    ({ winner, gobbler, witness, DROP_COL, DROP_ROW }) => {
      const w = window as W;
      for (const d of w.__dinoPositions()) w.__setNeed(d.name, 'hunger', 0); // nobody else pushes in
      w.__setGrudge('Mossback', 'Twitch', 0); // no feud squaring off on the way
      w.__placeDino(winner, DROP_COL, DROP_ROW);
      w.__placeDino(gobbler, DROP_COL + 3, DROP_ROW);
      w.__placeDino(witness, DROP_COL, DROP_ROW + 3);
      w.__setNeed(winner, 'hunger', 0.45);
      w.__setNeed(gobbler, 'hunger', 0.95);
      w.__setTrait(winner, 'agreeableness', 0.9);
      w.__setTrait(winner, 'bravery', 0.9);
      w.__setTrait(gobbler, 'agreeableness', 0.1);
      w.__dropFood(DROP_COL);
      w.__stepWorld();
    },
    { winner, gobbler, witness, DROP_COL, DROP_ROW },
  );
}

test('a friend who watches a dino stand up to a gobbler admires it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'all-bowl');
  const before = await page.evaluate(() => (window as W).__bond('Glade', 'Mossback') as number);
  expect(before).toBeGreaterThanOrEqual(10); // the founding friendship that makes Glade a friend

  await stand(page, 'Mossback', 'Rex', 'Glade');
  expect(await page.evaluate(() => (window as W).__standFood())).toEqual({ winner: 'Mossback', gobbler: 'Rex' });
  // Every friend of Mossback in range admires — on an all-bowl park Thornback (founding 16) may be watching too.
  const admire = await page.evaluate(() => (window as W).__lastAdmire());
  expect(admire).toMatchObject({ holder: 'Mossback', gobbler: 'Rex' });
  expect(admire.witnesses).toContain('Glade');
  expect(admire.witnesses).not.toContain('Twitch'); // a rival, not a friend
  const after = await page.evaluate(() => (window as W).__bond('Glade', 'Mossback') as number);
  expect(after).toBeGreaterThan(before);
  const mem = await page.evaluate(() => ((window as W).__memory().Glade ?? []) as string[]);
  expect(mem).toContain('you saw Mossback stand up to Rex');
  const log = await page.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
  expect(log).toContain('👏 Glade saw Mossback stand up to Rex');
  expect(errors).toEqual([]);
});

test('a stand with no friend watching is admired by nobody', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await boot(page);
  await foundingState(page, 'all-bowl');
  await foundingState(page, 'strangers');
  await stand(page, 'Mossback', 'Rex', 'Glade');
  expect(await page.evaluate(() => (window as W).__standFood())).toEqual({ winner: 'Mossback', gobbler: 'Rex' });
  expect(await page.evaluate(() => (window as W).__lastAdmire())).toBeNull();
  expect(errors).toEqual([]);
});
