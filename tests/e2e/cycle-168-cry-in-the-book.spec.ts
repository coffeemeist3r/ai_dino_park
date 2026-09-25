import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-195 — cry in the book.
 *
 * The book has rendered every dino at once since cycle 21, so there was no *entry* for a cry to
 * belong to. `N` gives it one: the cursor moves, that block names its own voice, and the bowl makes
 * that dino's call. Reachable from a fresh save with two keys and nothing else.
 */

type W = Record<string, unknown>;

const bookText = (p: Page) => p.evaluate(() => ((window as W).__bookText as () => string)());
const lastSound = (p: Page) =>
  p.evaluate(() =>
    ((window as W).__lastSound as () => { kind: string; name?: string; params?: { pitchHz: number } } | null)(),
  );
const muted = (p: Page) => p.evaluate(() => ((window as W).__soundMuted as () => boolean)());

/** The name carrying the cursor, read out of the book rather than assumed. */
function selectedName(text: string): string | null {
  const line = text.split('\n').find((l) => l.startsWith('▸'));
  return line ? line.slice(1).split('  (')[0] : null;
}

/** Cycle the lens ring until the book is up. */
async function openBook(page: Page): Promise<void> {
  await page.locator('canvas').focus();
  for (let i = 0; i < 8; i++) {
    const lens = await page.evaluate(() => ((window as W).__lens as () => string)?.());
    if (lens === 'book') return;
    await page.keyboard.press('KeyV');
    await settle(page);
  }
  throw new Error('never reached the book lens');
}

test('N steps a cursor through the book and plays what it lands on', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await openBook(page);

  // Exactly one entry carries the cursor, from the first render.
  const first = await bookText(page);
  expect((first.match(/▸/g) ?? []).length).toBe(1);

  await page.keyboard.press('KeyN');
  await settle(page);

  const after = await bookText(page);
  expect((after.match(/▸/g) ?? []).length).toBe(1);

  // The cry is the selected dino's own — the name is read out of the book, so this cannot pass on a
  // cursor that moved somewhere else.
  const who = selectedName(after);
  expect(who).toBeTruthy();
  const s = await lastSound(page);
  expect(s?.kind).toBe('chirp');
  expect(s?.name).toBe(who);
});

test('two entries, two voices — the first time the bowl plays them side by side', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await openBook(page);

  await page.keyboard.press('KeyN');
  await settle(page);
  const a = await lastSound(page);

  await page.keyboard.press('KeyN');
  await settle(page);
  const b = await lastSound(page);

  expect(a?.name).not.toBe(b?.name);
  expect(a?.params?.pitchHz).not.toBe(b?.params?.pitchHz);
});

test('the cursor wraps back to where it started', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await openBook(page);

  const start = selectedName(await bookText(page));
  const count = await page.evaluate(() => ((window as W).__bookRows as () => unknown[])().length);
  expect(count).toBeGreaterThan(1);

  for (let i = 0; i < count; i++) {
    await page.keyboard.press('KeyN');
    await settle(page);
    expect(((await bookText(page)).match(/▸/g) ?? []).length).toBe(1);
  }
  expect(selectedName(await bookText(page))).toBe(start);
});

test('the selected block names its voice, and only that block', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await openBook(page);

  const text = await bookText(page);
  expect((text.match(/🔊 voice · /g) ?? []).length).toBe(1);

  // and the line belongs to the row carrying the cursor
  const lines = text.split('\n');
  const cursor = lines.findIndex((l) => l.startsWith('▸'));
  const voice = lines.findIndex((l) => l.includes('🔊 voice · '));
  expect(voice).toBeGreaterThan(cursor);
  expect(voice - cursor).toBeLessThanOrEqual(2); // name line, hearts, then the voice
});

test('N outside the book lens does nothing at all', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await page.locator('canvas').focus();
  // Leave the book: cycle the ring away from it.
  await openBook(page);
  await page.keyboard.press('KeyV');
  await settle(page);
  expect(await page.evaluate(() => ((window as W).__lens as () => string)())).not.toBe('book');

  const before = await lastSound(page);
  await page.keyboard.press('KeyN');
  await settle(page);
  expect(await lastSound(page)).toEqual(before);
});

test('muted, the cursor still moves and the voice line still reads', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await openBook(page);

  await page.keyboard.press('KeyM');
  expect(await muted(page)).toBe(true);

  const before = await lastSound(page);
  const wasSelected = selectedName(await bookText(page));

  await page.keyboard.press('KeyN');
  await settle(page);

  const text = await bookText(page);
  expect(selectedName(text)).not.toBe(wasSelected); // the cursor is a read, not a sound
  expect((text.match(/🔊 voice · /g) ?? []).length).toBe(1);
  expect(await lastSound(page)).toEqual(before); // nothing was played

  await page.keyboard.press('KeyM'); // leave the device as we found it
});
