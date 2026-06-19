import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Fond greeting (BACKLOG-272). A close dino (≥8 hearts) opens warmly instead of with the generic hello.
 * Headless has no WebGPU → canned fallback (the deterministic half). Hearts are driven up via __greet
 * (BASE_GAIN 3/greet; 8 hearts = 80 points).
 */

type W = Record<string, any>;
const FOND = 'There you are';
const WISTFUL = 'came to see';

const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a close dino greets the keeper fondly', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Befriend Twitch (the warmest founder) up to the heart cap. Twitch + a Warm tone is a positive
  // personality fit, so the tone delta on the greet keeps affection at the top — well above FOND_MIN.
  const hearts = await page.evaluate(() => {
    let h = 0;
    for (let i = 0; i < 40; i++) h = (window as W).__greet('Twitch') as number;
    return h;
  });
  expect(hearts).toBeGreaterThanOrEqual(8);

  await pickTone(page, 'Twitch', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(FOND);
  expect(reply).toContain('Twitch');
  expect(reply).not.toContain(WISTFUL);
  expect(reply).not.toContain('cleared');
  expect(errors).toEqual([]);
});
