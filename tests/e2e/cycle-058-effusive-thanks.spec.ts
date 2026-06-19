import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Effusive thanks (BACKLOG-261). The warm twin of grudging thanks (253): a freshly-cleared warm dino
 * gushes about its clearer instead of the plain line. Twitch (agreeableness 0.929) is the warmest
 * founder; Rex (0.019) is the prickliest. Headless has no WebGPU, so the reply is the canned
 * fallback — the deterministic half of 261.
 */

type W = Record<string, any>;
const GUSH = 'never forget';
const PLAIN = 'I owe them one';
const GRUFF = 'thanks, I guess';

const rememberGrateful = (page: import('@playwright/test').Page, sufferer: string, clearer: string) =>
  page.evaluate(({ sufferer, clearer }) => (window as W).__rememberGrateful(sufferer, clearer), { sufferer, clearer });
const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a warm cleared dino gushes its thanks, naming the clearer', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await rememberGrateful(page, 'Twitch', 'Sunny');
  await pickTone(page, 'Twitch', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(GUSH); // the effusive register
  expect(reply).toContain('Sunny'); // still names the clearer
  expect(reply).not.toContain(GRUFF); // not the gruff phrasing
  expect(reply).not.toContain(PLAIN); // not the plain cycle-55 line
  expect(errors).toEqual([]);
});

test('the spectrum holds end-to-end — prickly Rex still grumbles the same favour', async ({ page }) => {
  await boot(page);

  await rememberGrateful(page, 'Rex', 'Sunny');
  await pickTone(page, 'Rex', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(GRUFF);
  expect(reply).toContain('Sunny');
  expect(reply).not.toContain(GUSH);
});
