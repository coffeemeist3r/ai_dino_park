import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The loner finds a friend (BACKLOG-369). On the fresh bowl every dino is a loner (all bonds below the
 * floor). The first time a loner's bond clears LONER_FLOOR it files a one-shot "not so alone now" memory
 * and its 🥀 lifts (already true off the live graph). The beat fires once ever per dino.
 */

type W = Record<string, any>;

const isLoner = (p: Page, n: string) => p.evaluate((nn) => (window as W).__isLoner(nn) as boolean, n);
const memory = (p: Page, n: string) => p.evaluate((nn) => ((window as W).__memory()[nn] ?? []) as string[], n);
const bondPair = (p: Page, a: string, b: string, amt: number) =>
  p.evaluate(({ a, b, amt }) => (window as W).__bondPair(a, b, amt), { a, b, amt });

const friendNotes = (mem: string[]) => mem.filter((e) => e.includes('not so alone'));

test('a loner that grows its first bond files one "not so alone" beat and stops being a loner', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Fresh bowl: Rex is a loner, no friend-beat yet.
  expect(await isLoner(page, 'Rex')).toBe(true);
  expect(friendNotes(await memory(page, 'Rex'))).toHaveLength(0);

  // A bond clears the floor (8) → Rex is no longer a loner, and the beat fires exactly once.
  await bondPair(page, 'Rex', 'Mossback', 10);
  expect(await isLoner(page, 'Rex')).toBe(false);
  expect(friendNotes(await memory(page, 'Rex'))).toHaveLength(1);

  // One-shot: a second friend above the floor adds no further loner-friend memory.
  await bondPair(page, 'Rex', 'Sunny', 10);
  expect(friendNotes(await memory(page, 'Rex'))).toHaveLength(1);

  expect(errors).toEqual([]);
});

test('a dino that was never a loner gets no loner-friend beat', async ({ page }) => {
  await boot(page);

  // Lift Glade out of loner status first (so it is not a loner), clearing any beat.
  await bondPair(page, 'Glade', 'Twitch', 10);
  const baseline = friendNotes(await memory(page, 'Glade')).length; // the one lift beat
  // A further bond rise on the already-friended dino adds nothing new.
  await bondPair(page, 'Glade', 'Twitch', 10);
  expect(friendNotes(await memory(page, 'Glade'))).toHaveLength(baseline);
});
