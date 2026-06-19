import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Grudging thanks (BACKLOG-253). The cleared-name thanks (247) now reads the dino's temperament:
 * prickly Rex (agreeableness 0.019) grumbles its thanks, warm Twitch (0.929) says it plain.
 * Headless has no WebGPU, so the reply is the canned fallback — the deterministic half of 253.
 */

type W = Record<string, any>;
const GRUFF = 'thanks, I guess';
const WARM = 'I owe them one';

const rememberGrateful = (page: import('@playwright/test').Page, sufferer: string, clearer: string) =>
  page.evaluate(({ sufferer, clearer }) => (window as W).__rememberGrateful(sufferer, clearer), { sufferer, clearer });
const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a prickly cleared dino grumbles its thanks', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await rememberGrateful(page, 'Rex', 'Twitch');
  await pickTone(page, 'Rex', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(GRUFF); // the gruff register
  expect(reply).toContain('Twitch'); // still names the clearer
  expect(reply).not.toContain(WARM); // not the warm phrasing
  expect(errors).toEqual([]);
});

test('a warm cleared dino keeps the plain warm thanks', async ({ page }) => {
  await boot(page);

  await rememberGrateful(page, 'Twitch', 'Sunny');
  await pickTone(page, 'Twitch', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(WARM); // unchanged cycle-55 line
  expect(reply).not.toContain(GRUFF);
});

test('a non-grateful greet of a prickly dino shows neither thanks phrase', async ({ page }) => {
  await boot(page);

  await pickTone(page, 'Rex', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).not.toContain(GRUFF);
  expect(reply).not.toContain(WARM);
  expect(reply).not.toContain('cleared');
});
