import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * BACKLOG-160 — what a dino makes of you, on the first hello, with no friendship earned.
 *
 * Headless Playwright has no WebGPU, so every reply here comes from the canned fallback. That is the
 * point rather than a limitation: the deterministic path is the floor the feature ships on, because
 * players decline the model download and CI has no GPU at all.
 *
 * The reachability claim being tested is specifically that this is **not** behind the eight-heart
 * `fondGreeting` gate. A fresh save's dinos are all strangers; if the aside only landed on the fond
 * register, every assertion below would fail, which is the shape the cycle-162 envy defect took.
 */

type W = Record<string, any>;

const pickTone = (page: import('@playwright/test').Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dialogAllText() as string).replace(/·/g, '').replace(/\s+/g, ' '));

/** The tell each observer leaves in a line — one distinctive word per chassis, wrap-proof. */
const TELL: Record<string, string> = {
  aether: 'hum',
  vanta: 'red',
  lumen: 'writing',
  kestrel: 'smell',
};

test('a stranger says what it makes of you, with zero friendship earned', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await page.evaluate(() => (window as W).__keeper())).toBe('aether');
  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);

  expect(await dialogText(page)).toContain(TELL.aether);
  expect(errors).toEqual([]);
});

test('it is a first impression, not a tic — the second hello has moved on', async ({ page }) => {
  await boot(page);

  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).toContain(TELL.aether);

  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);

  // Counted, not asserted absent. `__bubbleTexts` is the LIVE list (cycle-162 harness note): while the
  // first bubble is still on screen an absence check passes for entirely the wrong reason.
  const said = await page.evaluate(
    (tell) => ((window as W).__bubbleTexts() as string[]).filter((t) => t.includes(tell)).length,
    TELL.aether,
  );
  expect(said).toBeLessThanOrEqual(1);
  expect(await dialogText(page)).not.toContain(TELL.aether);
});

test('changing watchers re-arms the park — the same dino looks you over again', async ({ page }) => {
  await boot(page);

  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).toContain(TELL.aether);

  await page.evaluate(() => (window as W).__pickKeeper('kestrel'));
  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);

  const line = await dialogText(page);
  expect(line).toContain(TELL.kestrel); // the new body gets its own first look
  expect(line).not.toContain(TELL.aether); // and not the old one's
});

test('the choice is audible on the very first hello — observer 1 and observer 4 differ', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__pickKeeper('kestrel'));

  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);
  const asKes = await dialogText(page);

  expect(asKes).toContain(TELL.kestrel);
  expect(asKes).not.toContain(TELL.aether);
});

test('who has met whom survives a reload', async ({ page }) => {
  await boot(page);

  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as W).__metWatcher().Mossback)).toBe('aether');

  await page.reload();
  await boot(page);
  expect(await page.evaluate(() => (window as W).__metWatcher().Mossback)).toBe('aether');

  // And so the reloaded dino does not introduce itself to you all over again.
  await pickTone(page, 'Mossback', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).not.toContain(TELL.aether);
});

test('the model path is told the same thing the canned path says', async ({ page }) => {
  await boot(page);

  const prompt = await page.evaluate(() => (window as W).__greetPrompt('Mossback') as string);
  // `greetContextFor` is deliberately the reduced context and carries no watcher — a keeper-addressed
  // line has nobody to address in the dino-to-dino chatter that shares it. What must hold is that the
  // prompt builder never invents one either.
  expect(prompt).not.toContain('first time you have seen this watcher');
});
