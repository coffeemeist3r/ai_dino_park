import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Roles persist (BACKLOG-032). An emerged role is settled into a persisted store so it endures. Drive
 * Rex to a non-wanderer role via a strong bond (homebody at topBond ≥ 60) and confirm it lands in the
 * settled store and the exported save. (Non-reversion is unit-covered — __bondPair only raises bonds.)
 */

type W = Record<string, any>;

test('an emerged role is settled and persisted', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // A strong bond makes Rex a homebody (topBond ≥ 60).
  await page.evaluate(() => (window as W).__bondPair('Rex', 'Mossback', 60));

  const role = await page.evaluate(() => ((window as W).__roles() as Record<string, string>).Rex);
  expect(role).toBe('homebody');

  // The settled role is recorded in the durable store…
  const stored = await page.evaluate(() => ((window as W).__roleStore() as Record<string, string>).Rex);
  expect(stored).toBe('homebody');

  // …and rides the save.
  const saved = await page.evaluate(() => JSON.parse((window as W).__exportSave() as string));
  expect(saved.roles.Rex).toBe('homebody');

  expect(errors).toEqual([]);
});
