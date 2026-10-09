import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 27, cycle 182. BACKLOG-139: a dino that was talked round tells the keeper who came for it.
 * BACKLOG-578: a feud cools while the keeper is away, and the homecoming says so. Founding bonds and feud intact.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

const THANK = /^Sunny: Rex (sat with me, earlier\. I won't forget it\.|came over\. Didn't need it\.|came and sat with me\.)/;

/** Sunny loses a scramble to a bold Mossback; Rex (founding bond 30, close) is beside her. */
async function sunnyLoses(page: Page): Promise<void> {
  await boot(page);
  await foundingState(page, 'all-bowl');
  await ev(page, '__placeDino', 'Sunny', 5, 5);
  await ev(page, '__placeDino', 'Rex', 10, 5);
  await ev(page, '__dropFood', undefined, 'fish');
  await ev(page, '__setTrait', 'Mossback', 'bravery', 1);
  await ev(page, '__forceContest', 'Mossback', 'Sunny');
}

test('Sunny, talked round by Rex, tells the keeper who came — once (BACKLOG-139)', async ({ page }) => {
  await sunnyLoses(page);
  expect(await ev(page, '__consoler')).toMatchObject({ friend: 'Rex', loser: 'Sunny' });
  for (let i = 0; i < 16 && (await ev(page, '__consoler')); i++) await ev(page, '__stepWorld');
  expect(await ev(page, '__thanks')).toEqual({ Sunny: 'Rex' });

  const first = await ev<string>(page, '__pickTone', 'Sunny', 'warm');
  expect(first).toMatch(THANK);
  expect(await ev(page, '__thanks')).toEqual({});
  const second = await ev<string>(page, '__pickTone', 'Sunny', 'warm');
  expect(second).not.toMatch(THANK);
});

test('the keeper getting there first files no thanks (BACKLOG-139)', async ({ page }) => {
  await sunnyLoses(page);
  await ev(page, '__stepWorld');
  await ev(page, '__greet', 'Sunny');
  expect(await ev(page, '__consoler')).toBeNull();
  expect(await ev(page, '__thanks')).toEqual({});
});

const feud = async (page: Page) => (await ev<Record<string, number>>(page, '__grudges'))['Mossback|Twitch'] ?? 0;

test('five minutes away cools the founding feud a little, and the digest says so (BACKLOG-578)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const before = await feud(page);
  const r = await ev<{ digest: string[] }>(page, '__catchUp', 5 * 60_000);
  expect(await feud(page)).toBeLessThan(before);
  expect(r.digest).toContain('Mossback and Twitch cooled off a little.');
});

test('a week away and they seem to have let it go (BACKLOG-578)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const r = await ev<{ digest: string[] }>(page, '__catchUp', 7 * 24 * 60 * 60_000);
  expect(await feud(page)).toBeLessThan(20);
  expect(r.digest).toContain('Mossback and Twitch seem to have let it go.');
});
