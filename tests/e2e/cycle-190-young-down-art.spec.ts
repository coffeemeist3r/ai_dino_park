import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-610 — Pip sleeps from boot until 13:00 in its youth sleep pose; grown, it sleeps in the adult curl. */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

test('Pip sleeps curled in its youth pose until it molts (BACKLOG-610)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await expect
    .poll(async () => {
      await ev(page, '__stepWorld');
      return ev(page, '__youngDownArt', 'Pip');
    }, { timeout: 15_000 })
    .toBe(true);
  expect(await ev<string[]>(page, '__downPose')).toContain('Pip');
  expect(await ev(page, '__youngDownArt', 'Twitch')).toBe(false);
  await ev(page, '__moltNow', 'Pip');
  expect(await ev(page, '__youngDownArt', 'Pip')).toBe(false);
  expect(await ev<string[]>(page, '__downPose')).toContain('Pip'); // still asleep — now in the adult curl
});
