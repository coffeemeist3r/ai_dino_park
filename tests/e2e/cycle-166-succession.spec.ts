import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * BACKLOG-162 — the bowl remembers its watchers.
 *
 * Milestone 21's last arc, and the reachability claim under test is narrow and deliberate: **a switch
 * on day one, with nobody fond of anybody, still produces something the park says.** The item's own
 * wording is about a dino with high friendship under the old observer, and that door ships too — but it
 * is unreachable on a fresh save, so if it were the only door this whole file would be untestable
 * without arranging a friendship the player has not earned. The fit door is what makes it a beat.
 *
 * Headless Playwright has no WebGPU, so every reply here is the canned fallback — the floor the feature
 * ships on, which is the path a player who declines the model download also takes.
 *
 * **Two hellos, not one.** A switch re-arms BACKLOG-160's first impression for every dino, and the first
 * look takes precedence — so the hello right after a switch is *who are you*, and the miss lands on the
 * one after that. The design had this the other way round; `cycle-163-first-impression` refuted it, and
 * `greetTwice` below is that ruling made visible in every test that needs it.
 */

/** Say hello twice: the first spends the re-armed first look, the second is where the miss lands. */
const greetTwice = async (page: Page, name: string): Promise<string> => {
  await pickTone(page, name, 'warm');
  await page.waitForTimeout(150);
  await pickTone(page, name, 'warm');
  await page.waitForTimeout(150);
  return dialogText(page);
};

type W = Record<string, any>;

const pickTone = (page: Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (page: Page) =>
  page.evaluate(() => ((window as W).__dialogAllText() as string).replace(/·/g, '').replace(/\s+/g, ' '));
const pickKeeper = (page: Page, id: string) => page.evaluate((k) => (window as W).__pickKeeper(k), id);
const record = (page: Page) => page.evaluate(() => (window as W).__keeperRecord());
const ticker = (page: Page) => page.evaluate(() => (window as W).__ticker() as string[]);
const memory = (page: Page) => page.evaluate(() => (window as W).__memory() as Record<string, string[]>);

/** The word each watcher's miss line is built around — one per chassis, wrap-proof. */
const LOST: Record<string, string> = {
  aether: 'humming',
  vanta: 'red eye',
  lumen: 'round eye',
  kestrel: 'family',
};

test('the record files the switch, and a re-pick is not a switch', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect((await record(page)).switches).toBe(0);

  await pickKeeper(page, 'vanta');
  const after = await record(page);
  expect(after.switches).toBe(1);
  expect(after.previousId).toBe('aether');

  // 555's ruling, held at one site: wearing the chassis you are already wearing changes nothing.
  await pickKeeper(page, 'vanta');
  expect((await record(page)).switches).toBe(1);
  expect(errors).toEqual([]);
});

test('every dino files the change, and the park says so on the ticker', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const before = (await ticker(page)).length;

  await pickKeeper(page, 'vanta');

  const said = (await ticker(page)).slice(before).join(' | ');
  expect(said).toContain('Aki');
  expect(said).toContain('Vix');

  const filed = await memory(page);
  const names = Object.keys(filed);
  expect(names.length).toBeGreaterThan(0);
  for (const n of names) {
    expect(filed[n].some((e) => e.includes('the watcher changed')), `${n} did not notice`).toBe(true);
  }
});

test('a dino the old watcher suited says so — day one, zero friendship', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  // Aki is the default observer, so this is literally K-1-K-2: the switch a new player actually makes.
  await pickKeeper(page, 'vanta');

  // Sunny's traits favour Aki over Vix by well over MISS_MARGIN — asserted from ROSTER in the unit test,
  // so this name is not a magic choice that can quietly stop being true.
  const line = await greetTwice(page, 'Sunny');
  expect(line).toContain(LOST.aether);
  expect(await page.evaluate(() => (window as W).__toldOfSwitch().Sunny)).toBe('vanta');
});

test('it is a beat, not a tic — the second hello has moved on', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await pickKeeper(page, 'vanta');

  expect(await greetTwice(page, 'Sunny')).toContain(LOST.aether);

  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).not.toContain(LOST.aether);
});

// The precedence ruling, pinned from this side too. `cycle-163-first-impression` owns the positive half
// (the re-armed first look fires); this owns the half that belongs to 162 — the miss does not gatecrash it,
// and is not *spent* by being suppressed. It is still owed, and it is paid on the next hello.
test('the first look comes first, and the miss is held over rather than burned', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await pickKeeper(page, 'vanta');

  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);
  const first = await dialogText(page);
  // Sunny is a warm one, so Vix's first look is the gushing shade of it — the register decides the
  // wording, which is why this matches on the noun and not on a whole clause.
  expect(first).toContain('your eye'); // what it makes of the one standing there
  expect(first).not.toContain(LOST.aether);
  expect(await page.evaluate(() => (window as W).__toldOfSwitch().Sunny)).toBeUndefined();

  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).toContain(LOST.aether); // and then what it made of the one that went
});

test('a later switch re-arms the park, and names the watcher that just left', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await pickKeeper(page, 'vanta');
  await greetTwice(page, 'Sunny');

  await pickKeeper(page, 'kestrel');
  expect(await page.evaluate(() => (window as W).__toldOfSwitch())).toEqual({});

  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);
  const line = await dialogText(page);
  expect(line).not.toContain(LOST.aether); // Aki is two watchers ago; it is Vix that just left
});

test('who has been told survives a reload', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await pickKeeper(page, 'vanta');
  await greetTwice(page, 'Sunny');
  expect(await page.evaluate(() => (window as W).__toldOfSwitch().Sunny)).toBe('vanta');

  await page.evaluate(() => (window as W).__flushSave()); // BACKLOG-456: the save races a reload otherwise
  await page.reload();
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect(await page.evaluate(() => (window as W).__toldOfSwitch().Sunny)).toBe('vanta');
  await pickTone(page, 'Sunny', 'warm');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).not.toContain(LOST.aether);
});
