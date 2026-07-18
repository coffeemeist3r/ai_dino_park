import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Third-zone terrain identity (BACKLOG-399). The Fernreach (378) shipped as plain grass under a warm tint;
 * now it bakes its own ground (fernreachTileAt) like the grove does (294). Verify via the floor texture
 * key: the Fernreach gets its own terrain map, the bowl stays plain grass, the grove is byte-identical.
 */

type W = Record<string, any>;
const floor = (p: Page) =>
  p.evaluate(() => (window as W).__floorInfo() as { zone: string; key: string | null; tinted: boolean });
const setZone = (p: Page, id: string) => p.evaluate((z) => (window as W).__setZone(z), id);

test('the Fernreach bakes its own terrain map, distinct from bowl and grove', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // bowl: its own terrain map since BACKLOG-445 gave it a waterhole (was the plain grass tilemap).
  await setZone(page, 'bowl');
  expect((await floor(page)).key).toBe('terrain_bowl_20x15');

  // grove: its own terrain map (cycle-85 byte-identical).
  await setZone(page, 'grove');
  expect((await floor(page)).key).toBe('terrain_grove_20x15');

  // Fernreach: now its own terrain map (was 'grass' before 399), and tinted warm.
  await setZone(page, 'fernreach');
  const f = await floor(page);
  expect(f.key).toBe('terrain_fernreach_20x15');
  expect(f.tinted).toBe(true);

  expect(errors).toEqual([]);
});
