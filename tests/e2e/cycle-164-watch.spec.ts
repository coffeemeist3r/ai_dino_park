import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

// BACKLOG-555 — the watcher's record. The record is pure (keeper/record.ts) and the brass reads one
// line off it, so the whole thing is observable headless: boot, read the plaque, switch at K.

type W = Record<string, unknown>;

interface Record_ {
  id: string;
  sinceDay: number;
  switches: number;
  previousId?: string;
}

const record = (p: Page) => p.evaluate(() => ((window as W).__keeperRecord as () => Record_)());
const plaque = (p: Page) => p.evaluate(() => ((window as W).__plaqueLines as () => string[])());
const pickKeeper = (p: Page, id: string) =>
  p.evaluate((x) => ((window as W).__pickKeeper as (i: string) => string)(x), id);

const watchOf = (lines: string[]) => lines.find((l) => l.startsWith('Watch · ')) ?? '';

test('a fresh park engraves who is watching, since day one', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  // This spec's subject IS the founding state (CHARTER v7 / BACKLOG-495), so it names that fixture
  // rather than reaching for `all-bowl` or `empty-grounds` — the park exactly as a new player finds it.
  await foundingState(page, 'as-shipped');

  const rec = await record(page);
  expect(rec.switches).toBe(0);
  expect(rec.previousId).toBeUndefined();

  const line = watchOf(await plaque(page));
  expect(line).toContain('AETHER-1');
  expect(line).toContain('since day 1');
  // A brand-new park has had exactly one watcher, so a count would be noise, not news.
  expect(line).not.toContain('watcher');
  expect(errors).toEqual([]);
});

test('switching observers files the change and re-engraves the brass', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'vanta');
  await settle(page);

  const rec = await record(page);
  expect(rec.id).toBe('vanta');
  expect(rec.switches).toBe(1);
  expect(rec.previousId).toBe('aether');

  const line = watchOf(await plaque(page));
  expect(line).toContain('VANTA-9');
  expect(line).toContain('2nd watcher');
});

test('re-picking the observer you already wear is not a switch', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await pickKeeper(page, 'lumen');
  await settle(page);
  expect((await record(page)).switches).toBe(1);

  await pickKeeper(page, 'lumen');
  await settle(page);
  const rec = await record(page);
  expect(rec.switches).toBe(1);
  expect(rec.previousId).toBe('aether');
});

test('the record survives a reload, tenure and all', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  await pickKeeper(page, 'kestrel');
  await settle(page);
  await page.evaluate(() => ((window as W).__saveNow as () => unknown)());

  await page.reload();
  await boot(page);

  const rec = await record(page);
  expect(rec.id).toBe('kestrel');
  expect(rec.switches).toBe(1);
  expect(rec.previousId).toBe('aether');
  expect(watchOf(await plaque(page))).toContain('Kes');
});
