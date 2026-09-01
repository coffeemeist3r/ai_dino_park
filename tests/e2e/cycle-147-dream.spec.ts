import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Trait dreams (BACKLOG-307) — the frame-one read.
 *
 * Two things this spec deliberately does NOT do: it does not set the clock, and it does not bond anybody.
 * Both are the point. A fresh save opens with Rex — the roster's first dino, in the ground the save opens
 * on — asleep out in the open, hours from the den and hours outside the huddle window, with no memory of
 * anything. Before this cycle that dino could not murmur at all, and if it had it would have said the same
 * `…zzz…` as the other four.
 */

type W = Record<string, any>;

test('the dino this park ships asleep on frame one dreams, and dreams something of its own', async ({ page }) => {
  await boot(page);

  // No __setClock: whatever hour a fresh save opens on is the hour under test.
  const resting = await page.evaluate(() => (window as W).__resting() as string[]);
  expect(resting.length).toBeGreaterThan(0);
  const sleeper = resting[0];

  // It is asleep and NOT huddling — the gap between 109's sleep read and 181's den gate.
  expect(await page.evaluate(() => (window as W).__huddlers() as string[])).not.toContain(sleeper);

  const line = await page.evaluate((n) => (window as W).__forceMurmur(n) as string | null, sleeper);
  expect(line).not.toBeNull();
  expect(line!.startsWith('💭')).toBe(true);
  expect(line).not.toContain('zzz');
  expect(await page.evaluate(() => (window as W).__bubbleTexts() as string[])).toContain(line);
});

test('the founding cast does not have one dream between them', async ({ page }) => {
  await boot(page);
  const names = await page.evaluate(() => (window as W).__dinoNames() as string[]);
  const dreams = await page.evaluate(
    (ns) => ns.map((n: string) => (window as W).__murmur(n) as string),
    names,
  );
  expect(new Set(dreams).size).toBeGreaterThanOrEqual(3);
});

test('the book carries the dream on frame one, with no memory and no model', async ({ page }) => {
  await boot(page);
  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('dreams of');
});
