import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Migrating warmth (BACKLOG-178) — the year's grip on the bowl's daytime social density. Winter tightens the
 * drift-to-the-cluster roll (the cast seeks company in the cold), summer loosens it (they spread and laze),
 * spring/fall are the neutral hinges. The roll itself is probabilistic, so — like 461's __foodCap — we read
 * the grip through the __socialBias dev hook per season rather than counting a flaky sample.
 * Days: spring 1–7, summer 8–14, fall 15–21, winter 22–28 (SEASON_LENGTH_DAYS = 7).
 */

type W = Record<string, any>;

const setClock = (p: Page, day: number) => p.evaluate((d) => (window as W).__setClock(d, 12, 0), day);
const season = (p: Page) => p.evaluate(() => (window as W).__season() as string);
const socialBias = (p: Page) => p.evaluate(() => (window as W).__socialBias() as number);

test('the season shifts the social bias: winter tightens, summer loosens, the hinges hold at 1', async ({ page }) => {
  await boot(page);

  await setClock(page, 1); // spring — the hinge
  expect(await season(page)).toBe('spring');
  expect(await socialBias(page)).toBe(1);

  await setClock(page, 15); // fall — the other hinge
  expect(await season(page)).toBe('fall');
  expect(await socialBias(page)).toBe(1);

  await setClock(page, 22); // winter — seek company
  expect(await season(page)).toBe('winter');
  expect(await socialBias(page)).toBeGreaterThan(1);

  await setClock(page, 8); // summer — spread out
  expect(await season(page)).toBe('summer');
  expect(await socialBias(page)).toBeLessThan(1);
});
