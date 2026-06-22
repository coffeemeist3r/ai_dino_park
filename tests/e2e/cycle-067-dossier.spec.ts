import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Signature quirk in the dossier (BACKLOG-303). The collection book names each dino's idle fidget as a
 * kept fingerprint, in step with the live above-head quirk glyph (298). Deterministic — no model, no save.
 */

type W = Record<string, any>;

test('the book names each dino\'s signature quirk, matching its live fidget', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const rows = await page.evaluate(() => (window as W).__bookRows() as Array<{ name: string; quirk?: string }>);
  expect(rows.length).toBeGreaterThan(0);

  // every row carries a quirk label, and it matches that dino's live fidget label.
  for (const r of rows) {
    expect(r.quirk, `${r.name} has a quirk label`).toBeTruthy();
    const live = await page.evaluate((n) => (window as W).__fidget(n)?.label as string, r.name);
    expect(r.quirk).toBe(live);
  }

  // distinctness: the founders don't all share one quirk.
  const labels = new Set(rows.map((r) => r.quirk));
  expect(labels.size).toBeGreaterThanOrEqual(3);

  // the rendered book text actually shows a quirk line.
  const text = await page.evaluate(() => (window as W).__bookText() as string);
  expect(text).toContain(`· ${rows[0].quirk}`);

  expect(errors).toEqual([]);
});

test('the quirk line is deterministic across a reload', async ({ page }) => {
  await boot(page);
  const before = await page.evaluate(() => (window as W).__bookRows().map((r: any) => [r.name, r.quirk]));
  await page.reload();
  await boot(page);
  const after = await page.evaluate(() => (window as W).__bookRows().map((r: any) => [r.name, r.quirk]));
  expect(after).toEqual(before);
});
