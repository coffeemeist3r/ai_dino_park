import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 26 (tentpole), cycle 180. BACKLOG-589: the ground answers a newcomer. BACKLOG-588: the model's hand on whom
 * and where, on a floor that follows a companion across grounds. Both on the as-shipped founding state.
 */

type W = Record<string, any>;

async function crossBack(page: Page, name: string): Promise<string> {
  await page.evaluate((n) => (window as W).__migrate(n, 'grove'), name);
  await page.evaluate((n) => (window as W).__startMigrationTo(n, 'bowl'), name);
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    if (!(await page.evaluate(() => (window as W).__migrating() as string[])).includes(name)) break;
  }
  return (await page.evaluate(() => (window as W).__ticker() as string[])).find((l) => l.includes(`answers ${name}:`)) ?? '';
}

test('the bowl answers Sunny from yesterday: Rex is glad, Twitch turns away', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const line = await crossBack(page, 'Sunny');
  expect(line).toContain('🌿 Pocket Cretaceous answers Sunny:');
  expect(line).toContain('Rex glad it came');
  expect(line).toContain('Twitch turns away');
  const bubbles = (await page.evaluate(() => (window as W).__bubbleTexts())) as string[];
  expect(bubbles.some((b) => b === 'There you are, Sunny! I was hoping.' || b === 'Back! Good. I missed you.')).toBe(true);
});

test('the same ground answers Mossback differently: Twitch bristles, Glade is glad', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const line = await crossBack(page, 'Mossback');
  expect(line).toContain('Twitch bristles');
  expect(line).toContain('Glade glad it came');
});

test('a fresh park: an errand splits a pair, and the one left wanting goes after its companion', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect((await page.evaluate(() => (window as W).__seeking('Glade'))).name).toBe('Mossback');
  expect(await page.evaluate(() => (window as W).__errand())).toBe('Bramble');
  expect(await page.evaluate(() => (window as W).__errand())).toBe('Glade');
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    if (!(await page.evaluate(() => (window as W).__migrating() as string[])).includes('Glade')) break;
  }
  let followed = false;
  for (let i = 0; i < 6 && !followed; i++) {
    const who = await page.evaluate(() => (window as W).__errand());
    followed = who === 'Glade';
  }
  expect(followed).toBe(true);
  const ticker = (await page.evaluate(() => (window as W).__ticker() as string[])).join(' | ');
  expect(ticker).toContain('🧭 Glade sets off for Pocket Cretaceous — after Mossback.');
  expect(ticker).not.toContain('answers Glade:'); // BACKLOG-589: nobody on the Grove had an answer for it
  expect(await page.evaluate(() => (window as W).__migrating())).toContain('Glade');
});

test("the model's hand: a named companion is folded in, an unknown one is not", async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => (window as W).__setChoose('Twitch', null));
  await page.evaluate(() => (window as W).__setIntent('Sunny', 'social'));
  await expect.poll(() => page.evaluate(() => (window as W).__seeking('Sunny'))).toEqual({ name: 'Twitch', why: 'chosen', arrived: false });
  const ticker = (await page.evaluate(() => (window as W).__ticker() as string[])).join(' | ');
  expect(ticker).toContain('🧠 👀 Sunny goes looking for Twitch — its mind made up.');

  await page.evaluate(() => (window as W).__setChoose('Nobody', 'The Grove'));
  await page.evaluate(() => (window as W).__setIntent('Sunny', 'social'));
  await expect.poll(() => page.evaluate(() => (window as W).__place('Sunny'))).toBe('grove');
  expect((await page.evaluate(() => (window as W).__seeking('Sunny'))).name).toBe('Rex');
});
