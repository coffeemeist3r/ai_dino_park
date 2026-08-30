import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A place you were born and a place you walked to (BACKLOG-516).
 *
 * 512 gave five grounds a recorded founder and rendered every one of them through the sentence 343 wrote
 * for an *arrival*, so on the first frame of every save the book told five dinos they had crossed into
 * somewhere they had never left. Both halves are checked here: the book on a fresh save, and the one
 * ground in the park where a crossing can still be the first thing that ever happened.
 */

type W = Record<string, any>;
type Standing = { zone: string; kind: string; holders: string[]; via?: string };

const bookText = (p: Page) => p.evaluate(() => (window as W).__bookText() as string);
const standings = (p: Page) => p.evaluate(() => (window as W).__standings() as Standing[]);

test('the book says every founder has been there since the first morning', async ({ page }) => {
  await boot(page);
  const text = await bookText(page);

  expect(text).toContain('has been in the Grove since the first morning');
  // Not one crossing is claimed on a save where nobody has crossed anything yet.
  expect(text).not.toContain('first across');
});

test('the kind rides on the standing, so nothing downstream re-derives it', async ({ page }) => {
  await boot(page);
  const pioneers = (await standings(page)).filter((s) => s.kind === 'pioneer');

  expect(pioneers.length).toBeGreaterThan(0);
  for (const s of pioneers) expect(s.via, s.zone).toBe('born');
});

test('a ground nobody founded still says first across when somebody finally crosses', async ({ page }) => {
  await boot(page);
  // The Saltpan (505) is the park's one frontier — the only place a founding can still be a crossing.
  const before = (await standings(page)).filter((s) => s.kind === 'pioneer');
  expect(before.some((s) => s.zone === 'saltpan')).toBe(false);

  await page.evaluate(() => (window as W).__found('saltpan', 'Twitch'));

  const after = (await standings(page)).filter((s) => s.kind === 'pioneer');
  const saltpan = after.find((s) => s.zone === 'saltpan');
  expect(saltpan?.via).toBe('crossed');
  expect(await bookText(page)).toContain('first across into the Saltpan');
});
