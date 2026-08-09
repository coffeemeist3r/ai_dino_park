import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The chain forks (BACKLOG-478). The Sunward Ridge hangs north off the Grove — the first link in this park
 * that is not east/west — so the keeper crosses on the vertical axis for the first time, and the Grove is
 * the first ground to label three edges.
 */

type W = Record<string, any>;

const zone = (p: Page) => p.evaluate(() => (window as W).__zone() as string);
const labels = (p: Page) => p.evaluate(() => (window as W).__edgeLabels() as string[]);

test('the keeper walks north out of the Grove onto the Ridge, and back south', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await zone(page)).toBe('grove');

  // Hold ArrowUp until the north edge is crossed (the keeper is clamped, so a crossing is the only way out).
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => (window as W).__zone() === 'ridge', undefined, { timeout: 10_000 });
  await page.keyboard.up('ArrowUp');
  expect(await zone(page)).toBe('ridge');

  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => (window as W).__zone() === 'grove', undefined, { timeout: 10_000 });
  await page.keyboard.up('ArrowDown');
  expect(await zone(page)).toBe('grove');

  expect(errors).toEqual([]);
});

test('the Grove labels three edges, the Ridge one', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await labels(page)).toEqual(['◂ Pocket Cretaceous', 'The Fernreach ▸', '▴ The Sunward Ridge']);

  await page.evaluate(() => (window as W).__setZone('ridge'));
  expect(await labels(page)).toEqual(['The Grove ▾']);
});
