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

  // Befriend Twitch into the fond band at 8 hearts — fond fires and names by designation (276). The
  // cap (10) escalates to the nickname (278, cycle-062), so we pin to 8 to keep testing the fond pole.
  const hearts = await page.evaluate(() => (window as W).__setHearts('Twitch', 8) as number);
  expect(hearts).toBe(8);

  await pickTone(page, 'Twitch', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(FOND);
  // In-fire fixup (BACKLOG-276): the fond in-game line now names the chosen observer (default AETHER-1),
  // not the dino — deep friendship earns the keeper's name. Was `toContain('Twitch')` at cycle 60.
  expect(reply).toContain('AETHER-1');
  expect(reply).not.toContain(WISTFUL);
  expect(reply).not.toContain('cleared');
  expect(errors).toEqual([]);
});
