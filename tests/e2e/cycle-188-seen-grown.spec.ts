import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 30 (TENTPOLE), cycle 188. BACKLOG-604: anybody born from an egg starts young, and at a molt the dinos it
 * belongs to on its ground walk over — on a fresh save, Bramble to Pip at 14:00 on day one. BACKLOG-605: on arrival
 * each says so in its own capacity, and the grown dino stops greeting the keeper as a youngster does.
 */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

test('Bramble walks to Pip at the molt and says so (BACKLOG-604/605)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__advanceMinutes', 6 * 60 + 1); // 08:00 → 14:01: Pip molts
  expect((await ev<Record<string, any>>(page, '__moltVisits')).Bramble).toMatchObject({ to: 'Pip', role: 'friend' });
  for (let i = 0; i < 32; i++) {
    if (!(await ev<Record<string, unknown>>(page, '__moltVisits')).Bramble) break;
    await ev(page, '__stepWorld');
  }
  expect((await ev<Record<string, unknown>>(page, '__moltVisits')).Bramble).toBeUndefined();
  expect((await ev<Record<string, string[]>>(page, '__memory')).Bramble).toContain('saw Pip grow up');
  expect(await ev<string[]>(page, '__ticker')).toContain('Bramble → Pip: Look at you, Pip!');
});

test('Pip greets the keeper as a youngster, then grown once, then as itself (BACKLOG-605)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__pickTone('Pip', 'warm'))).toContain("I'm nearly big");
  expect(await page.evaluate(() => (window as W).__pickTone('Rex', 'warm'))).not.toMatch(/nearly big|I'm grown/);
  await ev(page, '__moltNow', 'Pip');
  expect(await page.evaluate(() => (window as W).__pickTone('Pip', 'warm'))).toContain("I'm grown");
  const again = await page.evaluate(() => (window as W).__pickTone('Pip', 'warm'));
  expect(again).not.toMatch(/nearly big|I'm grown/);
  expect((await ev<Record<string, any>>(page, '__growth')).Pip.greeted).toBe(true);

  await ev(page, '__saveNow');
  await page.reload();
  await page.waitForFunction(() => (window as W).__ready === true, undefined, { timeout: 30_000 });
  await expect.poll(() => ev<Record<string, any>>(page, '__growth').then((g) => g.Pip?.greeted), { timeout: 10_000 }).toBe(true);
});

test('a hatchling starts young, and its parents come to its molt (BACKLOG-604)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__layEgg', 'Rex', 'Sunny');
  await ev(page, '__forceHatch');
  const baby = Object.keys(await ev<Record<string, unknown>>(page, '__growth')).find((n) => n !== 'Pip')!;
  expect(baby).toBeTruthy();
  expect(await ev(page, '__stageOf', baby)).toBe('young');
  expect(await ev(page, '__dinoScale', baby)).toBe(0.5);
  await ev(page, '__moltNow', baby);
  const visits = await ev<Record<string, { to: string; role: string }>>(page, '__moltVisits');
  expect(visits.Rex).toMatchObject({ to: baby, role: 'parent' });
  expect(visits.Sunny).toMatchObject({ to: baby, role: 'parent' });
});

test('Pip wears a scrap of shell until it molts (BACKLOG-606)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await expect.poll(() => ev<string[]>(page, '__shellCaps'), { timeout: 5_000 }).toEqual(['Pip']);
  await ev(page, '__moltNow', 'Pip');
  await expect.poll(() => ev<string[]>(page, '__shellCaps'), { timeout: 5_000 }).toEqual([]);
});
