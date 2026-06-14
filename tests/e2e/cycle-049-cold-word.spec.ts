import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

test('a cold-slept dino lets the word of the cold slip to the next it meets', async ({ page }) => {
  await boot(page);

  // Mossback slept cold last winter night; it leads with the news on the next meeting.
  const rumor = await page.evaluate(() => {
    ((window as W).__rememberCold as (n: string) => void)('Mossback');
    return ((window as W).__spreadColdWord as (a: string, b: string) => string | null)('Mossback', 'Sunny');
  });
  expect(rumor).not.toBeNull();
  expect(rumor).toContain('Mossback');

  const expected = await page.evaluate(() => ((window as W).__coldWord as (s: string) => string)('Mossback'));
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory.Sunny).toContain(expected);

  // One hop: Sunny merely heard it, so it can't re-tell the cold as fresh news.
  const second = await page.evaluate(() =>
    ((window as W).__spreadColdWord as (a: string, b: string) => string | null)('Sunny', 'Glade'),
  );
  expect(second).toBeNull();
});

test('a dino with no cold memory passes nothing — generic gossip still carries first-hand news', async ({ page }) => {
  await boot(page);

  // No cold night happened for Rex → no word of the cold.
  const cold = await page.evaluate(() =>
    ((window as W).__spreadColdWord as (a: string, b: string) => string | null)('Rex', 'Sunny'),
  );
  expect(cold).toBeNull();

  // The generic gossip spine (cycle 20) is untouched: a greeted dino still retells first-hand.
  const rumor = await page.evaluate(() => {
    ((window as W).__greet as (n: string) => unknown)('Rex');
    return ((window as W).__spreadGossip as (a: string, b: string) => string | null)('Rex', 'Sunny');
  });
  expect(rumor).toContain('told me:');
});
