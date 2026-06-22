import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-157 — Field Scan, LUMEN-3's distinct ability. The dossier is pure (keeper/scan.ts), so
// the whole flow is observable headless: pick an observer, stand by a dino, press B.

type W = Record<string, unknown>;

const pickKeeper = (p: Page, id: string) =>
  p.evaluate((x) => ((window as W).__pickKeeper as (i: string) => string)(x), id);
const warpTo = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__warpTo as (x: string) => boolean)(n), name);
const scanOpen = (p: Page) => p.evaluate(() => ((window as W).__scanOpen as () => boolean)());
const scanLines = (p: Page) => p.evaluate(() => ((window as W).__scanLines as () => string[])());
const canScan = (p: Page) => p.evaluate(() => ((window as W).__canScan as () => boolean)());
const bubbles = (p: Page) => p.evaluate(() => ((window as W).__bubbleTexts as () => string[])());

test('as LUMEN-3, B beside a dino opens the dossier (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'lumen');
  expect(await canScan(page)).toBe(true);
  // The pick confirmation is a dialog; E closes it so B is the next meaningful key.
  await page.keyboard.press('KeyE');

  expect(await warpTo(page, 'Rex')).toBe(true);
  await page.keyboard.press('KeyB');
  await expect.poll(() => scanOpen(page)).toBe(true);

  const lines = (await scanLines(page)).join('\n');
  expect(lines).toContain('Rex');
  expect(lines).toContain('triceratops');
  expect(lines).toContain('mood:');
  expect(lines).toContain('loves');
  expect(errors).toEqual([]);
});

test('the dossier reports the resting quirk, matching the live fidget (BACKLOG-312)', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'lumen');
  await page.keyboard.press('KeyE');
  await warpTo(page, 'Rex');
  await page.keyboard.press('KeyB');
  await expect.poll(() => scanOpen(page)).toBe(true);

  const quirk = await page.evaluate(() => ((window as W).__fidget('Rex') as { label: string }).label);
  const lines = (await scanLines(page)).join('\n');
  expect(lines).toContain('habit:');
  expect(lines).toContain(quirk);
});

test('B again closes the dossier', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'lumen');
  await page.keyboard.press('KeyE');
  await warpTo(page, 'Rex');

  await page.keyboard.press('KeyB');
  await expect.poll(() => scanOpen(page)).toBe(true);
  await page.keyboard.press('KeyB');
  await expect.poll(() => scanOpen(page)).toBe(false);
});

test('other observers cannot scan — B yields an in-character refusal, no panel', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  // Default observer is AETHER-1 — no Scholar Lens sensors.
  expect(await canScan(page)).toBe(false);
  await warpTo(page, 'Rex');
  await page.keyboard.press('KeyB');

  await expect.poll(() => bubbles(page)).toContain(
    'AETHER-1: "A diplomat does not pry into a mind. I read the room, not the soul."',
  );
  expect(await scanOpen(page)).toBe(false);
});

test('the scan never blocks the talk path — E still opens the tone menu with the dossier up', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'lumen');
  await page.keyboard.press('KeyE');
  await warpTo(page, 'Rex');

  await page.keyboard.press('KeyB');
  await expect.poll(() => scanOpen(page)).toBe(true);

  await page.keyboard.press('KeyE');
  await expect
    .poll(() => page.evaluate(() => ((window as W).__toneMenuOpen as () => boolean)()))
    .toBe(true);
});
