import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Earned the nickname (BACKLOG-278). At the heart cap (10) a dino drops the keeper's designation for
 * its nickname ("There you are, Aki!"); at 8–9 hearts it still uses the designation ("AETHER-1"),
 * exactly cycle-61. Headless has no WebGPU → the canned fallback. The default observer is AETHER-1 "Aki".
 */

type W = Record<string, any>;
const FOND = 'There you are';
const DESIGNATION = 'AETHER-1';
const NICKNAME = 'Aki';

const setHearts = (page: import('@playwright/test').Page, name: string, h: number) =>
  page.evaluate(({ name, h }) => (window as W).__setHearts(name, h) as number, { name, h });
const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('the closest dino (max hearts) greets the keeper by nickname', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await setHearts(page, 'Twitch', 10)).toBe(10);
  await pickTone(page, 'Twitch', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(FOND);
  expect(reply).toContain(NICKNAME); // the intimate nickname
  expect(reply).not.toContain(DESIGNATION); // not the formal designation
  expect(errors).toEqual([]);
});

test('a fond-but-not-closest dino (8 hearts) still uses the designation', async ({ page }) => {
  await boot(page);
  expect(await setHearts(page, 'Twitch', 8)).toBe(8);
  await pickTone(page, 'Twitch', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(FOND);
  expect(reply).toContain(DESIGNATION); // cycle-61 behavior preserved below the cap
});
