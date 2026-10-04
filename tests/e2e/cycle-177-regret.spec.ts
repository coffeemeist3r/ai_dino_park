import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Guilty gobbler (BACKLOG-391) and standoffs count at the hatch (BACKLOG-577).
 *
 * 391: the admire spec's staging over the production `checkFeeding` path, with a timid winner. Sunny reaches the drop,
 * Rex — her best friend on the founding graph — shoulders past, regrets it, and says sorry at their next meeting.
 * 577: two forced squares-off between the founding rivals put both on the book's pecking line.
 */

type W = Record<string, any>;
const DROP_COL = 2;
const DROP_ROW = 6;

async function shove(page: Page, winner: string, gobbler: string) {
  await page.evaluate(
    ({ winner, gobbler, DROP_COL, DROP_ROW }) => {
      const w = window as W;
      for (const d of w.__dinoPositions()) w.__setNeed(d.name, 'hunger', 0); // nobody else pushes in
      w.__setGrudge('Mossback', 'Twitch', 0); // no feud squaring off on the way
      w.__placeDino(winner, DROP_COL, DROP_ROW);
      w.__placeDino(gobbler, DROP_COL + 3, DROP_ROW);
      w.__setNeed(winner, 'hunger', 0.45);
      w.__setNeed(gobbler, 'hunger', 0.95);
      w.__setTrait(winner, 'bravery', 0.1); // cedes
      w.__setTrait(gobbler, 'agreeableness', 0.1);
      w.__dropFood(DROP_COL);
      w.__stepWorld();
    },
    { winner, gobbler, DROP_COL, DROP_ROW },
  );
}

const memOf = (page: Page, name: string) =>
  page.evaluate((n) => (((window as W).__memory()[n] ?? []) as string[]), name);
const log = (page: Page) => page.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));

test('shoving past a friend is regretted, and the next meeting opens with sorry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'all-bowl');
  expect(await page.evaluate(() => (window as W).__bond('Rex', 'Sunny') as number)).toBeGreaterThanOrEqual(10);

  await shove(page, 'Sunny', 'Rex');
  expect(await page.evaluate(() => (window as W).__gobbleFood())).toEqual({ winner: 'Sunny', gobbler: 'Rex' });
  expect(await page.evaluate(() => (window as W).__lastRegret())).toEqual({ gobbler: 'Rex', friend: 'Sunny' });
  expect(await memOf(page, 'Rex')).toContain("you shoved past Sunny and wished you hadn't");
  expect(await log(page)).toContain('😓 Rex felt bad about shoving past Sunny');

  // Either side may open the meeting; the apology is said by whoever owes it.
  const convo = await page.evaluate(() => (window as W).__forceConverse('Sunny', 'Rex'));
  expect(convo).toMatchObject({ speaker: 'Rex', text: 'Sorry about the hatch, Sunny. I was starving.' });
  expect(await log(page)).toContain('🙇 Rex said sorry to Sunny');
  const rex = await memOf(page, 'Rex');
  expect(rex).not.toContain("you shoved past Sunny and wished you hadn't");
  expect(rex).toContain('you said sorry to Sunny for the hatch');
  expect(await memOf(page, 'Sunny')).toContain('Rex said sorry for the hatch');

  // Said once: the next meeting is ordinary talk again.
  const again = await page.evaluate(() => (window as W).__forceConverse('Rex', 'Sunny'));
  expect(again.text).not.toContain('Sorry about the hatch');
  expect(errors).toEqual([]);
});

test('shoving past a stranger costs nothing', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'all-bowl');
  await foundingState(page, 'strangers');
  await shove(page, 'Sunny', 'Rex');
  expect(await page.evaluate(() => (window as W).__gobbleFood())).toEqual({ winner: 'Sunny', gobbler: 'Rex' });
  expect(await page.evaluate(() => (window as W).__lastRegret())).toBeNull();
  expect(await memOf(page, 'Rex')).not.toContain("you shoved past Sunny and wished you hadn't");
});

test('two stare-downs in the grass put the founding rivals on the pecking line', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => (window as W).__placeDino('Mossback', 8, 7));
  for (let i = 0; i < 2; i++) await page.evaluate(() => (window as W).__forceStandoff('Mossback', 'Twitch'));
  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('👊 pecking order: faced down Twitch');
  expect(book).toContain('👊 pecking order: wary of Mossback');
});
