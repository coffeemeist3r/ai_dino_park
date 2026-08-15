import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Mealtime mood in the voice (BACKLOG-404). The hatch ledger has been read as a career (402) and as a
 * per-opponent history (401); this reads it as a *feeling* — the last contested drop tints the next line,
 * names who it was with, and goes quiet when the memory rolls off the 6-slot ring.
 *
 * Headless has no WebGPU, so the reply is the canned fallback — the deterministic half of the tell.
 */

type W = Record<string, any>;

/** Any of the twelve lines, one pattern per outcome. */
const SMUG = /got in ahead of|did rather snatch|got to the drop before/;
const PROUD = /did not take my food|hold my ground against|stood my ground against/;
const SORE = /wouldn't shift|wouldn't budge and I just|wouldn't move off the drop/;
const ANY_MEALTIME = new RegExp([SMUG.source, PROUD.source, SORE.source, 'let .+ have the last one|eat first|stepped back'].join('|'));

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const remember = (p: Page, name: string, event: string) =>
  p.evaluate(([n, e]) => (window as W).__remember(n, e), [name, event]);
const pickTone = (p: Page, name: string, id: string) =>
  p.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (p: Page) => p.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);

test('a dino that just took the drop says so, naming who it took it from', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [eater, victim] = await roster(page);
  await remember(page, eater, `you shouldered past ${victim} and snatched the food first`);

  await pickTone(page, eater, 'honest');
  await page.waitForTimeout(150);
  const reply = await dialogText(page);
  expect(reply).toMatch(SMUG);
  expect(reply).toContain(victim); // the ledger always named who; so does the voice
  expect(reply).toContain('came to see'); // composed onto the wistful register (271), not replacing it

  expect(errors).toEqual([]);
});

test('a dino with a quiet ring says nothing about mealtimes', async ({ page }) => {
  await boot(page);
  const [dino] = await roster(page);
  await pickTone(page, dino, 'honest');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).not.toMatch(ANY_MEALTIME);
});

test('the newest beat is the one it is carrying — a win last night is not this morning', async ({ page }) => {
  await boot(page);
  const [dino, other] = await roster(page);

  await remember(page, dino, `you stood your ground and kept your food from ${other}`);
  await remember(page, dino, `${other} wouldn't budge — you slunk off`);

  await pickTone(page, dino, 'honest');
  await page.waitForTimeout(150);
  const reply = await dialogText(page);
  expect(reply).toMatch(SORE);
  expect(reply).not.toMatch(PROUD);
});
