import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ritual in the book (BACKLOG-409). The item's whole discipline is that the line is **earned**: the book
 * names a ritual the park actually performed, never one `signatureTic(traits)` would answer if asked. So the
 *negative case is pinned as hard as the positive one — a fresh park, where every dino has a derivable signature
 * tic and not one of them has fallen into it, must show no ritual line anywhere.
 *
 * After 407 the line also carries provenance, so the second half of this spec drives the echo through the
 * game's own `__watchTic` path and asserts the borrowed entry names who it came off.
 */

type W = Record<string, any>;

const book = (p: Page) => p.evaluate(() => (window as W).__bookText() as string);
const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const ticOf = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);

/** The book block for one dino — from its name line to the next dino's, so a claim can't match a neighbour. */
function blockFor(text: string, name: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`${name}  (`));
  if (start < 0) return '';
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^\S/.test(l) && l.includes('  ('));
  return [lines[start], ...(end < 0 ? rest : rest.slice(0, end))].join('\n');
}

test('a fresh park names no rituals — every dino has one derivable, none has performed it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await book(page)).not.toContain('ritual:');
  expect(errors).toEqual([]);
});

test('a dino that falls into its ritual gets it named in the book, and only that dino', async ({ page }) => {
  await boot(page);
  const names = await roster(page);
  const [subject, other] = names;

  await page.evaluate((n) => (window as W).__inventTic(n), subject);
  const theirs = (await ticOf(page, subject)).tic as { glyph: string; label: string };

  const text = await book(page);
  expect(blockFor(text, subject)).toContain(`${theirs.glyph} ritual: ${theirs.label}`);
  expect(blockFor(text, other)).not.toContain('ritual:');
});

test('the ritual line outlives the stretch that made it — company returns, the book keeps the fact', async ({
  page,
}) => {
  await boot(page);
  const [subject] = await roster(page);

  await page.evaluate((n) => (window as W).__inventTic(n), subject);
  expect(await book(page)).toContain('ritual:');

  // A whole solitary stretch's worth of steps with the cast crowded in: the per-stretch flag drops, the
  // lifetime fact does not. This is the distinction the item is built on.
  await page.evaluate((names) => {
    const w = window as W;
    (names as string[]).forEach((n, i) => w.__placeDino(n, 4 + i, 6));
  }, await roster(page));
  for (let i = 0; i < 4; i++) await page.evaluate(() => (window as W).__stepWorld());

  expect(((await ticOf(page, subject)) as { invented: boolean }).invented).toBe(false);
  expect(blockFor(await book(page), subject)).toContain('ritual:');
});

test('a borrowed ritual names the friend it was caught off; the friend it came from does not', async ({
  page,
}) => {
  await boot(page);
  const names = await roster(page);
  const [performer, watcher, ...rest] = names;

  await page.evaluate(
    ({ performer, watcher, rest }) => {
      const w = window as W;
      w.__placeDino(performer, 4, 6);
      w.__placeDino(watcher, 9, 6); // in the band: past company range, inside the watch range
      (rest as string[]).forEach((n, i) => w.__placeDino(n, 1 + i, 1));
      w.__bondPair(performer, watcher, 50);
      w.__inventTic(performer);
    },
    { performer, watcher, rest },
  );
  for (let i = 0; i < 3; i++) await page.evaluate((n) => (window as W).__watchTic(n), performer);

  const theirs = (await ticOf(page, performer)).tic as { glyph: string; label: string };
  const text = await book(page);
  expect(blockFor(text, watcher)).toContain(`ritual: ${theirs.label} — caught off ${performer}`);
  expect(blockFor(text, performer)).toContain('ritual:');
  expect(blockFor(text, performer)).not.toContain('caught off');
});

test('the book remembers the ritual across a reload — it is a save fact, not a session one', async ({ page }) => {
  await boot(page);
  const [subject] = await roster(page);

  await page.evaluate((n) => (window as W).__inventTic(n), subject);
  const before = blockFor(await book(page), subject);
  expect(before).toContain('ritual:');

  await page.evaluate(() => ((window as W).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await boot(page);

  expect(blockFor(await book(page), subject)).toContain('ritual:');
});
