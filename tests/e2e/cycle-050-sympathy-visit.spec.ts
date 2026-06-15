import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

type Visit = { visitor: string; sufferer: string; memory: string } | null;

test('a dino that heard about a cold night comes to find the sufferer', async ({ page }) => {
  await boot(page);

  // Mossback slept cold; Sunny heard the word of it (the cycle-185 plant).
  await page.evaluate(() => {
    ((window as W).__rememberCold as (n: string) => void)('Mossback');
    ((window as W).__spreadColdWord as (a: string, b: string) => string | null)('Mossback', 'Sunny');
  });

  const before = await page.evaluate(() =>
    ((window as W).__bond as (a: string, b: string) => number)('Sunny', 'Mossback'),
  );
  expect(before).toBe(0);

  // Now Sunny meets Mossback: it crosses over to keep it company.
  const visit = await page.evaluate(() =>
    ((window as W).__sympathyVisit as (a: string, b: string) => Visit)('Sunny', 'Mossback'),
  );
  expect(visit).not.toBeNull();
  expect(visit!.visitor).toBe('Sunny');
  expect(visit!.sufferer).toBe('Mossback');

  // The sufferer keeps the memory that someone came, and the bond ticks up by the console bump.
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory.Mossback.some((m) => m.includes('Sunny') && m.includes('came to find'))).toBe(true);

  const after = await page.evaluate(() =>
    ((window as W).__bond as (a: string, b: string) => number)('Sunny', 'Mossback'),
  );
  expect(after).toBe(2); // COMFORT_BOND
});

test('the carrier is the visitor regardless of who the meeting names first', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => {
    ((window as W).__rememberCold as (n: string) => void)('Mossback');
    ((window as W).__spreadColdWord as (a: string, b: string) => string | null)('Mossback', 'Sunny');
  });

  // Args swapped — Mossback "meets" Sunny — but Sunny is the one carrying the word, so Sunny visits.
  const visit = await page.evaluate(() =>
    ((window as W).__sympathyVisit as (a: string, b: string) => Visit)('Mossback', 'Sunny'),
  );
  expect(visit).not.toBeNull();
  expect(visit!.visitor).toBe('Sunny');
  expect(visit!.sufferer).toBe('Mossback');
});

test('no carried word → no visit, no bond change', async ({ page }) => {
  await boot(page);

  const before = await page.evaluate(() =>
    ((window as W).__bond as (a: string, b: string) => number)('Rex', 'Glade'),
  );

  const visit = await page.evaluate(() =>
    ((window as W).__sympathyVisit as (a: string, b: string) => Visit)('Rex', 'Glade'),
  );
  expect(visit).toBeNull();

  const after = await page.evaluate(() =>
    ((window as W).__bond as (a: string, b: string) => number)('Rex', 'Glade'),
  );
  expect(after).toBe(before);
});
