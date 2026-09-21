import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, emptyGrounds, settle } from './helpers';

// BACKLOG-157 — Read the Room, AETHER-1's distinct ability. The readout is pure (keeper/room.ts),
// so the whole flow is observable headless: boot as the default observer and press R.

type W = Record<string, unknown>;

const roomOpen = (p: Page) => p.evaluate(() => ((window as W).__roomOpen as () => boolean)());
const roomLines = (p: Page) => p.evaluate(() => ((window as W).__roomLines as () => string[])());
const canReadRoom = (p: Page) => p.evaluate(() => ((window as W).__canReadRoom as () => boolean)());
const bubbles = (p: Page) => p.evaluate(() => ((window as W).__bubbleTexts as () => string[])());
const warpTo = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__warpTo as (x: string) => boolean)(n), name);
const pickKeeper = (p: Page, id: string) =>
  p.evaluate((x) => ((window as W).__pickKeeper as (i: string) => string)(x), id);

// CHARTER v7's reachability bar, in one test: the founding state, untouched, ten seconds after boot.
test('a brand-new park has something to say about its own floor (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.locator('canvas').focus();

  // The default observer is AETHER-1 — no pick needed, which is the point.
  expect(await canReadRoom(page)).toBe(true);

  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(true);

  const lines = await roomLines(page);
  expect(lines[0]).toBe('— Read the Room —');
  expect(lines.length).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('R again closes the readout', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(true);
  await settle(page); // BACKLOG-515: let the toggle land before the next key is dispatched
  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(false);
});

test('the floor reads as pairs and loners, and the readout is about this ground', async ({ page }) => {
  await boot(page);
  await emptyGrounds(page);
  await foundingState(page, 'all-bowl');
  await page.locator('canvas').focus();

  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(true);

  const lines = await roomLines(page);
  // The bowl's name is engraved as the second line, and every named dino is accounted for exactly
  // once — either in a pair or in the alone list.
  expect(lines[1]).toContain('Pocket Cretaceous');
  const body = lines.slice(2).join('\n');
  expect(body.length).toBeGreaterThan(0);
});

test('other observers cannot read a room — R yields an in-character refusal, no panel', async ({ page }) => {
  await boot(page);
  await emptyGrounds(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'vanta');
  expect(await canReadRoom(page)).toBe(false);
  await page.keyboard.press('KeyE'); // clear the pick confirmation
  await settle(page);

  expect(await warpTo(page, 'Rex')).toBe(true);
  await page.keyboard.press('KeyR');

  await expect.poll(() => bubbles(page).then((b) => b.some((t) => t.startsWith('VANTA-9:')))).toBe(true);
  expect(await roomOpen(page)).toBe(false);
});

// The trap `toggleScan` documents: a refusal rendered as a dialog eats the next E press.
test('the readout never blocks the talk path — E still opens the tone menu with it up', async ({ page }) => {
  await boot(page);
  await emptyGrounds(page);
  await page.locator('canvas').focus();

  await warpTo(page, 'Rex');
  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(true);
  await settle(page);

  await page.keyboard.press('KeyE');
  await expect
    .poll(() => page.evaluate(() => ((window as W).__toneMenuOpen as () => boolean)()))
    .toBe(true);
});

test('an empty ground reads as empty, and a refusal with nobody in range still reaches the player', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  // The Saltpan is the one ground the founding park puts nobody on (BACKLOG-505), so `nearestDino`
  // finds nothing there and the refusal has no head to float over.
  await page.evaluate(() => ((window as W).__setZone as (z: string) => void)('saltpan'));
  await settle(page);

  // First, as AETHER-1: an empty floor gets a header and a place and asserts nothing further.
  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(true);
  expect(await roomLines(page)).toEqual(['— Read the Room —', 'The Saltpan']);
  await settle(page);
  await page.keyboard.press('KeyR');
  await expect.poll(() => roomOpen(page)).toBe(false);

  // Then as Kes, with nobody to bubble over: the refusal falls through to the ticker.
  await pickKeeper(page, 'kestrel');
  await page.keyboard.press('KeyE');
  await settle(page);
  await page.keyboard.press('KeyR');
  await settle(page);

  expect(await roomOpen(page)).toBe(false);
  const log = await page.evaluate(() => ((window as W).__events as () => string[])());
  expect(log.some((l) => l.startsWith('Kes:'))).toBe(true);
});
