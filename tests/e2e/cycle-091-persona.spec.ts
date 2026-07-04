import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Persona pipeline (BACKLOG-103). Headless CI has no WebGPU, so this exercises exactly the
 * CHARTER-required floor: a deterministic procedural persona, generated once, persisted in the
 * save, restored byte-identical — the full sim with zero model download.
 */

type W = Record<string, any>;
type P = { text: string; source: string };

test('every dino gets a procedural self with zero model, distinct per dino', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const out = await page.evaluate(() => ({
    rex: (window as W).__persona('Rex') as P,
    moss: (window as W).__persona('Mossback') as P,
  }));
  expect(out.rex.source).toBe('procedural');
  expect(out.rex.text.length).toBeGreaterThan(20);
  expect(out.moss.text).not.toBe(out.rex.text);
  expect(errors).toEqual([]);
});

test('a persona is generated once, saved, and restored byte-identical', async ({ page }) => {
  await boot(page);

  const before = await page.evaluate(() => (window as W).__persona('Rex') as P);
  // The save now carries it…
  const saved = await page.evaluate(async () => {
    await (window as W).__saveNow();
    return JSON.parse((window as W).__exportSave() as string).personas as Record<string, P>;
  });
  expect(saved.Rex.text).toBe(before.text);

  // …and a reload restores the same self rather than regenerating a different one.
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as W).__personas as undefined | (() => Record<string, unknown>);
      return !!f && !!f().Rex;
    },
    { timeout: 8_000 },
  );
  const after = await page.evaluate(() => (window as W).__persona('Rex') as P);
  expect(after.text).toBe(before.text);
  expect(after.source).toBe(before.source);
});

test('generate-once: repeated reads return the same cached self', async ({ page }) => {
  await boot(page);

  const out = await page.evaluate(() => {
    const first = (window as W).__persona('Rex') as P;
    const second = (window as W).__persona('Rex') as P;
    const store = ((window as W).__personas as () => Record<string, P>)();
    return { first, second, cached: store.Rex };
  });
  expect(out.second.text).toBe(out.first.text);
  expect(out.cached.text).toBe(out.first.text);
});
