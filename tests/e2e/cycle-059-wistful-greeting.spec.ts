import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Wistful greeting (BACKLOG-271). A neglected dino — rock-bottom player-friendship (a fresh founder is
 * at 0 hearts) and nothing to be grateful for — opens wistfully instead of with the generic hello.
 * Headless has no WebGPU, so the reply is the canned fallback (the deterministic half of 271).
 */

type W = Record<string, any>;
const WISTFUL = 'came to see';
const THANKS = 'cleared'; // any gratitude phrasing

const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a neglected dino greets the keeper wistfully', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Rex is a fresh founder at 0 hearts with no gratitude pending → wistful.
  await pickTone(page, 'Rex', 'honest');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).toContain(WISTFUL); // the wistful register
  expect(reply).toContain('Rex'); // names the dino
  expect(reply).not.toContain(THANKS); // not the gratitude line
  expect(errors).toEqual([]);
});
