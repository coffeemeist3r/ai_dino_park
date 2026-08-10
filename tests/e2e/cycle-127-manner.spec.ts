import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The manner at the hatch (BACKLOG-402). The contested-drop trio (375/385 yield, 387 gobble, 390 stand,
 * 394 slink-off) has been filing memories since cycle 84 and the book has never read one. Now each dino
 * carries one folded character note — and a dino that has never contested a drop carries none.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const bookText = (p: Page) => p.evaluate(() => (window as W).__bookText() as string);
const remember = (p: Page, name: string, event: string) =>
  p.evaluate(([n, e]) => (window as W).__remember(n, e), [name, event]);

/** The block of book lines belonging to one dino (its header line up to the next dino's header). */
function blockFor(text: string, name: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${name}  (`));
  expect(start).toBeGreaterThan(-1);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^\S/.test(l) && l.includes('  ('));
  return [lines[start], ...(end === -1 ? rest : rest.slice(0, end))].join('\n');
}

test('a contested drop gives a dino its table manner in the book; a quiet one shows none', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [bold, quiet] = await roster(page);

  // Nobody has contested a drop on a fresh boot, so nobody has a manner.
  expect(await bookText(page)).not.toContain('at the hatch');

  await remember(page, bold, `you stood your ground and kept your food from ${quiet}`);

  const text = await bookText(page);
  expect(blockFor(text, bold)).toContain('🍽️ at the hatch: unbowed — holds its ground and keeps its food');
  expect(blockFor(text, quiet)).not.toContain('at the hatch');

  expect(errors).toEqual([]);
});

test('the manner follows the count, not the last thing that happened', async ({ page }) => {
  await boot(page);
  const [dino, other] = await roster(page);

  await remember(page, dino, `you stepped back and let ${other} eat first`);
  await remember(page, dino, `you repaid ${other}'s kindness at the hatch`);
  await remember(page, dino, `you shouldered past ${other} and snatched the food first`);

  // Two generous beats outweigh the greedy one that happened most recently.
  expect(blockFor(await bookText(page), dino)).toContain('at the hatch: generous');
});
