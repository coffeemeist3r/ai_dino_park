import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The keeper has a name (BACKLOG-276). A fond (≥8 hearts) dino names the chosen observer by designation
 * in its hello. Headless has no WebGPU → the canned fallback (the deterministic half). The default
 * observer is AETHER-1, so the fond line should name "AETHER-1".
 */

type W = Record<string, any>;
const FOND = 'There you are';
const WISTFUL = 'came to see';
const AKI = 'AETHER-1';

const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a close dino greets the keeper by designation', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Befriend Twitch (the warmest founder) up to the heart cap — a Warm tone on Twitch is a positive fit.
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
  expect(reply).toContain(AKI); // names the default observer, not the dino
  expect(reply).not.toContain(WISTFUL);
  expect(reply).not.toContain('cleared');
  expect(errors).toEqual([]);
});
