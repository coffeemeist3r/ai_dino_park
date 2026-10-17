import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/** BACKLOG-608 — Pip walks in its youth pose while young and in the adult rig once grown; Twitch, the same
 *  species, is an adult and never wears it. */

type W = Record<string, any>;
const ev = <T>(p: Page, fn: string, ...args: unknown[]): Promise<T> =>
  p.evaluate(([f, a]) => ((window as W)[f as string] as (...x: unknown[]) => T)(...(a as unknown[])), [fn, args] as const);

test('Pip wears the youth pose until it molts (BACKLOG-608)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await ev(page, '__advanceMinutes', 5 * 60 + 1); // Pip is an owl: awake from 13:00, still young until 14:00
  await expect
    .poll(async () => {
      await ev(page, '__stepWorld');
      return ev(page, '__youngArt', 'Pip');
    }, { timeout: 15_000 })
    .toBe(true);
  expect(await ev(page, '__youngArt', 'Twitch')).toBe(false);
  await ev(page, '__moltNow', 'Pip');
  expect(await ev(page, '__youngArt', 'Pip')).toBe(false);
});
