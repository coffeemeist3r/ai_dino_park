import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Third-zone resource bias (BACKLOG-400). The Fernreach leans a third kind (🌾 frond): its rolls favour
 * frond, a banked frond shows in the Stores readout, and frond never leaks into the bowl's rolls.
 */

type W = Record<string, any>;

const biasKind = (p: Page, zone: string, r: number) =>
  p.evaluate(({ zone, r }) => (window as W).__biasKind(zone, r), { zone, r });
const stores = (p: Page) => p.evaluate(() => ((window as W).__plaque() as { stockpile: string }).stockpile);

test('the Fernreach leans frond, banks it into Stores, and never leaks frond into the bowl', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The bias: below BIAS_WEIGHT (0.75) the favoured kind rolls; above it, the off-kind.
  expect(await biasKind(page, 'fernreach', 0.1)).toBe('frond'); // Fernreach favours frond
  expect(await biasKind(page, 'fernreach', 0.9)).not.toBe('frond'); // off-kind is a primary
  expect(await biasKind(page, 'bowl', 0.1)).toBe('stone'); // bowl unchanged (348)
  expect(await biasKind(page, 'bowl', 0.9)).toBe('branch');
  // frond is Fernreach-exclusive — a bowl roll is never frond at any r.
  for (const r of [0.0, 0.25, 0.5, 0.74, 0.75, 0.99]) {
    expect(await biasKind(page, 'bowl', r)).not.toBe('frond');
    expect(await biasKind(page, 'grove', r)).not.toBe('frond');
  }

  // A frond banked into the Fernreach's pile shows in the both-zone Stores readout.
  await page.evaluate(() => (window as W).__setZonePile('fernreach', { frond: 2 }));
  const line = await stores(page);
  expect(line).toContain('🌾 2');
  expect(line).toContain('Fernreach');

  expect(errors).toEqual([]);
});
