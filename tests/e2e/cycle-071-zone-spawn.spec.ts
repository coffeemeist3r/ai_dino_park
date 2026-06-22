import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Zone-aware resource spawn (BACKLOG-314). Resources live per zone now: each inhabited zone holds its
 * own slot, so a bowl resource and a grove resource coexist, only the keeper's zone draws its own, and
 * crossing swaps which is shown. (Per-zone banking is 328; this is the per-zone spawn spine.)
 */

type W = Record<string, any>;

const resource = (p: Page) => p.evaluate(() => (window as W).__resource());
const objVisible = (p: Page) => p.evaluate(() => (window as W).__objVisible());
const setZone = (p: Page, id: string) => p.evaluate((z) => (window as W).__setZone(z), id);

test('each zone holds its own resource; only the active one is shown', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // A bowl resource (active zone = bowl at boot).
  await page.evaluate(() => (window as W).__spawnResource('branch', 5, 5, true));
  expect((await resource(page)).zone).toBe('bowl');
  expect((await objVisible(page)).resource).toBe(true);

  // Force a grove resource while the keeper is still in the bowl — it must not be drawn here.
  await page.evaluate(() => (window as W).__spawnResource('stone', 8, 8, true, 'grove'));
  expect((await resource(page)).zone).toBe('bowl'); // active zone still shows the bowl one
  expect((await objVisible(page)).resource).toBe(true);

  // Cross to the grove: now its own resource is the active one and is drawn; the bowl one is hidden.
  await setZone(page, 'grove');
  expect((await resource(page)).zone).toBe('grove');
  expect((await objVisible(page)).resource).toBe(true);

  // Back in the bowl: the bowl resource is still there (two slots coexisted the whole time).
  await setZone(page, 'bowl');
  expect((await resource(page)).zone).toBe('bowl');
  expect((await objVisible(page)).resource).toBe(true);

  expect(errors).toEqual([]);
});
