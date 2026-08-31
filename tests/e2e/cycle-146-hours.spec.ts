import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, any>;

/**
 * BACKLOG-109 — not everybody keeps the same hours.
 *
 * The first test is the CHARTER v7 bar and nothing else: a fresh save opens at day 1, 08:00, and the split
 * has to read *then*, without touching the clock, because nightfall is twelve real minutes away and the bar
 * is measured over ten. If this spec ever needs `__advanceMinutes` to see the feature, the feature is
 * dormant on a shipping save and the item has failed its own criterion.
 */
test.describe('BACKLOG-109 — the hours a dino keeps', () => {
  test('reads on frame one: the Bowl owl is down at 08:00 while the day-dinos are up', async ({ page }) => {
    await boot(page);

    const hour = await page.evaluate(() => (window as W).__clockNow().hour);
    expect(hour).toBe(8);

    const types = await page.evaluate(() => (window as W).__chronotypes());
    expect(types.Rex).toBe('owl');
    expect(types.Sunny).toBe('day');

    const resting: string[] = await page.evaluate(() => (window as W).__resting());
    expect(resting).toContain('Rex');
    expect(resting).not.toContain('Sunny');
    expect(resting).not.toContain('Mossback');
  });

  test('a resting dino holds its tile — it does not mill about like the ones that are awake', async ({ page }) => {
    await boot(page);

    const before = await page.evaluate(() => (window as W).__stepWorld());
    const after = await page.evaluate(() => (window as W).__stepWorld());
    const posOf = (rows: Array<{ name: string; x: number; y: number }>, n: string) => rows.find((r) => r.name === n)!;

    // Rex is the founding park's owl and it is eight in the morning: it is asleep, so it is where it was.
    expect(posOf(after, 'Rex').x).toBe(posOf(before, 'Rex').x);
    expect(posOf(after, 'Rex').y).toBe(posOf(before, 'Rex').y);
  });

  test('the night is the mirror: the owl is the only thing moving', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => (window as W).__advanceMinutes(15 * 60)); // 08:00 → 23:00

    const resting: string[] = await page.evaluate(() => (window as W).__resting());
    const roused: string[] = await page.evaluate(() => (window as W).__roused());

    expect(roused).toContain('Rex');
    expect(resting).not.toContain('Rex');
    expect(resting.length).toBeGreaterThan(0);
    // The two reads are complements — nobody is asleep and up in the same frame, so the two glyphs that
    // hang off them can never stack in the one slot they share.
    expect(roused.filter((n) => resting.includes(n))).toEqual([]);
  });

  test('the book carries the standing, with no waiting for any particular hour', async ({ page }) => {
    await boot(page);
    const text: string = await page.evaluate(() => (window as W).__bookText());
    expect(text).toContain('keeps late hours');
    expect(text).toContain('up with the sun');
  });
});
