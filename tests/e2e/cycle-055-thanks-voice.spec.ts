import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Thanks in the voice (BACKLOG-247). A dino that carries a first-hand `<clearer> cleared my name`
 * memory (filed by clearedName, 243) names that clearer in its next keeper greeting. Headless
 * Playwright has no WebGPU, so the reply comes from the canned fallback — which is exactly the
 * deterministic half of this feature: the thanks line names the clearer with no model.
 */

type W = Record<string, any>;

const rememberGrateful = (page: import('@playwright/test').Page, sufferer: string, clearer: string) =>
  page.evaluate(({ sufferer, clearer }) => (window as W).__rememberGrateful(sufferer, clearer), { sufferer, clearer });
const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a just-cleared dino names who cleared its name when greeted', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await rememberGrateful(page, 'Mossback', 'Twitch');
  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150); // the reply resolves async, then renders into the dialog

  const reply = await dialogText(page);
  expect(reply).toContain('Twitch'); // gratitude surfaces in the spoken line
  expect(reply).toContain('Mossback'); // the dialog is still Mossback speaking
  expect(errors).toEqual([]);

  // And the LLM-colour path: the enriched greet prompt carries the same fact.
  const prompt = await page.evaluate(() => (window as W).__greetPrompt('Mossback') as string);
  expect(prompt).toContain('Twitch');
  expect(prompt).toContain('cleared your name');
});

test('a dino with no cleared-name memory greets without naming any clearer', async ({ page }) => {
  await boot(page);

  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);

  const reply = await dialogText(page);
  expect(reply).not.toContain('cleared');
  expect(reply).not.toContain('I owe them one');

  const prompt = await page.evaluate(() => (window as W).__greetPrompt('Sunny') as string);
  expect(prompt).not.toContain('cleared your name');
});
