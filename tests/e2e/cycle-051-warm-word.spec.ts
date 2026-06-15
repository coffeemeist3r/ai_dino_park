import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

test('a warmed dino lets the word of the warmth slip to the next it meets', async ({ page }) => {
  await boot(page);

  // Rex was warmed by the keeper after a cold night; it leads with the good news on the next meeting.
  const rumor = await page.evaluate(() => {
    ((window as W).__rememberWarm as (n: string) => void)('Rex');
    return ((window as W).__spreadWarmWord as (a: string, b: string) => string | null)('Rex', 'Mossback');
  });
  expect(rumor).not.toBeNull();
  expect(rumor).toContain('Rex');

  const expected = await page.evaluate(() => ((window as W).__warmWord as (s: string) => string)('Rex'));
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory.Mossback).toContain(expected);

  // One hop: Mossback merely heard it, so it can't re-tell the warmth as fresh news.
  const second = await page.evaluate(() =>
    ((window as W).__spreadWarmWord as (a: string, b: string) => string | null)('Mossback', 'Sunny'),
  );
  expect(second).toBeNull();
});

test('a rescued dino leads with the warmth, not the cold — warm word wins at the converse seam', async ({ page }) => {
  await boot(page);

  // The speaker is dinos[0]; plant BOTH a cold memory and a warm one on it (it slept cold, then
  // the keeper came). Without the warm-first ordering its warm memory (which contains "cold night")
  // would still spread the COLD word; the seam must lead with the warmth instead.
  const { speaker, listener, rumor } = await page.evaluate(async () => {
    const names = ((window as W).__dinoNames as () => string[])();
    const a = names[0];
    const b = names[1];
    ((window as W).__rememberCold as (n: string) => void)(a);
    ((window as W).__rememberWarm as (n: string) => void)(a);
    const conv = await ((window as W).__forceConverse as () => Promise<{ speaker: string }>)();
    return { speaker: a, listener: b, rumor: conv };
  });

  const warm = await page.evaluate((s: string) => ((window as W).__warmWord as (x: string) => string)(s), speaker);
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  // The listener heard the WARM word, not the cold one.
  expect(memory[listener]).toContain(warm);

  // The event log shows the 😊 warm register for this meeting, not the 🥶 cold one.
  const events = await page.evaluate(() => ((window as W).__events as () => string[])());
  const warmLog = events.find((e) => e.includes('😊') && e.includes(speaker));
  expect(warmLog).toBeTruthy();
  expect(warmLog).toContain(`heard the keeper warmed ${speaker}`);
  expect(rumor).toBeTruthy();
});
