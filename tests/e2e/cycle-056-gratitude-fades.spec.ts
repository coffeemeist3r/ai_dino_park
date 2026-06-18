import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Gratitude fades (BACKLOG-251). A just-cleared dino names its clearer when greeted (247), but the
 * thanks is a passing feeling: once the dino has filed a few newer memories (it lives on), the
 * cleared-name memory falls out of its freshest thoughts and the greet returns to a normal hello.
 * Headless has no WebGPU, so the reply comes from the canned fallback — the deterministic half.
 *
 * GRATITUDE_FRESH_WINDOW is 3 in world/cold.ts; burying the grateful memory under that many newer
 * memories pushes it out of the window. (Kept in sync with the const by this comment.)
 */

type W = Record<string, any>;
const FRESH_WINDOW = 3;

const rememberGrateful = (page: import('@playwright/test').Page, sufferer: string, clearer: string) =>
  page.evaluate(({ sufferer, clearer }) => (window as W).__rememberGrateful(sufferer, clearer), { sufferer, clearer });
const rememberCold = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((name) => (window as W).__rememberCold(name), name);
const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);
const greetPrompt = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((name) => (window as W).__greetPrompt(name) as string, name);

test('the spoken thanks fades once newer memories bury the clearing', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Fresh: the clearing is the newest memory → the thanks surfaces (247 still works).
  await rememberGrateful(page, 'Mossback', 'Twitch');
  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).toContain('Twitch');
  expect(await greetPrompt(page, 'Mossback')).toContain('cleared your name');

  // Live on: file FRESH_WINDOW newer memories, burying the clearing out of the fresh window.
  for (let i = 0; i < FRESH_WINDOW; i++) await rememberCold(page, 'Mossback');

  // Faded: the greet no longer names the clearer; both the canned line and the prompt go quiet.
  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);
  const faded = await dialogText(page);
  expect(faded).not.toContain('Twitch');
  expect(faded).not.toContain('I owe them one');
  expect(await greetPrompt(page, 'Mossback')).not.toContain('cleared your name');

  expect(errors).toEqual([]);
});
